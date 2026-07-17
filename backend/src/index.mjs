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
const REUNIONES = process.env.TABLE_REUNIONES;
const NOTAS = process.env.TABLE_NOTAS;
const AVATARS_BUCKET = process.env.AVATARS_BUCKET;

const TYPES = ["stream", "charla", "especial"];
const ROLES = ["miembro", "participante", "admin"];
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

const canParticipate = (role) => role === "participante" || role === "admin";

async function withAvatarUrl(item) {
  if (item?.avatarKey && AVATARS_BUCKET) {
    try {
      item.photoURL = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: AVATARS_BUCKET, Key: item.avatarKey }),
        { expiresIn: 3600 }
      );
    } catch {
      /* omitir foto propia si falla */
    }
  }
  return item;
}

const parseBody = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
};

export const handler = async (event) => {
  const route = event.routeKey;
  const claims = claimsOf(event);
  const userId = claims.sub || claims.user_id;
  const email = claims.email || "";
  const name = claims.name || "";

  if (!userId) return json(401, { error: "Token sin identidad de usuario" });

  // ══════════ PERFIL ══════════
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

  if (route === "PUT /me") {
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
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

  if (route === "POST /avatar-upload") {
    if (!AVATARS_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
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

  // ══════════ EVENTOS ══════════
  if (route === "GET /eventos") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EVENTS }));
    const eventos = (Items ?? []).sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
    return json(200, { eventos });
  }

  if (route === "POST /eventos") {
    if ((await getRole(userId)) !== "admin")
      return json(403, { error: "Solo administradores pueden crear eventos" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { date, time, title, type, description, premium } = body;
    if (!date || !time || !title || !type)
      return json(400, { error: "Faltan campos: date, time, title, type" });
    if (!TYPES.includes(type)) return json(400, { error: `type debe ser: ${TYPES.join(", ")}` });
    const item = {
      id: randomUUID(),
      date, time, title, type,
      description: description ?? "",
      premium: Boolean(premium),
      createdBy: email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: EVENTS, Item: item }));
    return json(201, { evento: item });
  }

  if (route === "DELETE /eventos/{id}") {
    if ((await getRole(userId)) !== "admin")
      return json(403, { error: "Solo administradores pueden eliminar eventos" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: EVENTS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ AGENDA DE REUNIONES (participante/admin) ══════════
  if (route === "GET /reuniones") {
    if (!canParticipate(await getRole(userId)))
      return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: REUNIONES }));
    const reuniones = (Items ?? []).sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
    return json(200, { reuniones });
  }

  if (route === "POST /reuniones") {
    if (!canParticipate(await getRole(userId)))
      return json(403, { error: "Solo participantes" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { date, time, title, description, lugar } = body;
    if (!date || !time || !title)
      return json(400, { error: "Faltan campos: date, time, title" });
    const item = {
      id: randomUUID(),
      date, time, title,
      description: description ?? "",
      lugar: lugar ?? "",
      createdByUserId: userId,
      createdByName: name || email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: REUNIONES, Item: item }));
    return json(201, { reunion: item });
  }

  if (route === "DELETE /reuniones/{id}") {
    const role = await getRole(userId);
    if (!canParticipate(role)) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: REUNIONES, Key: { id } }));
    if (Item && Item.createdByUserId !== userId && role !== "admin")
      return json(403, { error: "Solo el autor o un admin puede eliminar" });
    await ddb.send(new DeleteCommand({ TableName: REUNIONES, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ NOTAS / IDEAS (participante/admin) ══════════
  if (route === "GET /notas") {
    if (!canParticipate(await getRole(userId)))
      return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: NOTAS }));
    const notas = (Items ?? []).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt))
    );
    return json(200, { notas });
  }

  if (route === "POST /notas") {
    if (!canParticipate(await getRole(userId)))
      return json(403, { error: "Solo participantes" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { titulo, contenido } = body;
    if (!contenido && !titulo) return json(400, { error: "La nota está vacía" });
    const item = {
      id: randomUUID(),
      titulo: (titulo ?? "").slice(0, 140),
      contenido: (contenido ?? "").slice(0, 4000),
      createdByUserId: userId,
      createdByName: name || email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: NOTAS, Item: item }));
    return json(201, { nota: item });
  }

  if (route === "DELETE /notas/{id}") {
    const role = await getRole(userId);
    if (!canParticipate(role)) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: NOTAS, Key: { id } }));
    if (Item && Item.createdByUserId !== userId && role !== "admin")
      return json(403, { error: "Solo el autor o un admin puede eliminar" });
    await ddb.send(new DeleteCommand({ TableName: NOTAS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ GESTIÓN DE USUARIOS / ROLES (admin) ══════════
  if (route === "GET /usuarios") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
    const usuarios = (Items ?? [])
      .map((u) => ({ userId: u.userId, email: u.email, name: u.name, role: u.role ?? "miembro" }))
      .sort((a, b) => String(a.email).localeCompare(String(b.email)));
    return json(200, { usuarios });
  }

  if (route === "PUT /usuarios/{id}/role") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const targetId = event.pathParameters?.id;
    const role = body.role;
    if (!targetId || !ROLES.includes(role))
      return json(400, { error: `role debe ser: ${ROLES.join(", ")}` });
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId: targetId },
        UpdateExpression: "SET #r = :r",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":r": role },
      })
    );
    return json(200, { ok: true, userId: targetId, role });
  }

  return json(404, { error: "Ruta no encontrada" });
};
