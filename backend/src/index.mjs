import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const USERS = process.env.TABLE_USERS;
const EVENTS = process.env.TABLE_EVENTS;
const AVATARS_BUCKET = process.env.AVATARS_BUCKET;

const TYPES = ["stream", "charla", "especial"];
const PROFILE_FIELDS = ["apodo", "pais", "region", "telefono"];

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const claimsOf = (event) => event?.requestContext?.authorizer?.jwt?.claims ?? {};

async function getRole(userId) {
  const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
  return Item?.role ?? "miembro";
}

// Devuelve el usuario con una URL de avatar firmada (si subió foto propia).
async function withAvatarUrl(item) {
  if (!item) return item;
  if (item.avatarKey && AVATARS_BUCKET) {
    try {
      item.photoURL = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: AVATARS_BUCKET, Key: item.avatarKey }),
        { expiresIn: 3600 }
      );
    } catch {
      /* si falla, se omite la foto propia */
    }
  }
  return item;
}

export const handler = async (event) => {
  const route = event.routeKey;
  const claims = claimsOf(event);
  const userId = claims.sub || claims.user_id;
  const email = claims.email || "";
  const name = claims.name || "";

  if (!userId) return json(401, { error: "Token sin identidad de usuario" });

  // ── GET /me : registra al usuario y devuelve sus datos ──
  if (route === "GET /me") {
    const now = new Date().toISOString();
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression:
          "SET email = :e, #n = :n, lastLogin = :t, createdAt = if_not_exists(createdAt, :t), #r = if_not_exists(#r, :role)",
        ExpressionAttributeNames: { "#n": "name", "#r": "role" },
        ExpressionAttributeValues: { ":e": email, ":n": name, ":t": now, ":role": "miembro" },
      })
    );
    const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
    return json(200, { user: await withAvatarUrl(Item) });
  }

  // ── PUT /me : actualiza el perfil (apodo, pais, region, telefono, avatarKey) ──
  if (route === "PUT /me") {
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "JSON inválido" });
    }

    const names = {};
    const values = {};
    const sets = [];
    for (const f of PROFILE_FIELDS) {
      if (typeof body[f] === "string") {
        names[`#${f}`] = f;
        values[`:${f}`] = body[f].trim().slice(0, 120);
        sets.push(`#${f} = :${f}`);
      }
    }
    // avatarKey solo puede ser el del propio usuario
    if (body.avatarKey === `avatars/${userId}`) {
      names["#ak"] = "avatarKey";
      values[":ak"] = body.avatarKey;
      sets.push("#ak = :ak");
    }
    if (sets.length === 0) return json(400, { error: "Nada que actualizar" });

    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression: "SET " + sets.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
    const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
    return json(200, { user: await withAvatarUrl(Item) });
  }

  // ── POST /avatar-upload : URL firmada para subir la foto a S3 ──
  if (route === "POST /avatar-upload") {
    if (!AVATARS_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "JSON inválido" });
    }
    const contentType = body.contentType || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif)$/.test(contentType))
      return json(400, { error: "Formato de imagen no permitido" });

    const key = `avatars/${userId}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: AVATARS_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 300 }
    );
    return json(200, { uploadUrl, key, contentType });
  }

  // ── GET /eventos ──
  if (route === "GET /eventos") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EVENTS }));
    const eventos = (Items ?? []).sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
    return json(200, { eventos });
  }

  // ── POST /eventos (solo admin) ──
  if (route === "POST /eventos") {
    if ((await getRole(userId)) !== "admin")
      return json(403, { error: "Solo administradores pueden crear eventos" });
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return json(400, { error: "JSON inválido" });
    }
    const { date, time, title, type, description, premium } = body;
    if (!date || !time || !title || !type)
      return json(400, { error: "Faltan campos: date, time, title, type" });
    if (!TYPES.includes(type))
      return json(400, { error: `type debe ser: ${TYPES.join(", ")}` });

    const item = {
      id: randomUUID(),
      date,
      time,
      title,
      type,
      description: description ?? "",
      premium: Boolean(premium),
      createdBy: email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: EVENTS, Item: item }));
    return json(201, { evento: item });
  }

  // ── DELETE /eventos/{id} (solo admin) ──
  if (route === "DELETE /eventos/{id}") {
    if ((await getRole(userId)) !== "admin")
      return json(403, { error: "Solo administradores pueden eliminar eventos" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: EVENTS, Key: { id } }));
    return json(200, { ok: true });
  }

  return json(404, { error: "Ruta no encontrada" });
};
