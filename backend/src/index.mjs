import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const USERS = process.env.TABLE_USERS;
const EVENTS = process.env.TABLE_EVENTS;
const REUNIONES = process.env.TABLE_REUNIONES;
const NOTAS = process.env.TABLE_NOTAS;
const EPISODIOS = process.env.TABLE_EPISODIOS;
const DESCARGAS = process.env.TABLE_DESCARGAS;
const PREGUNTAS = process.env.TABLE_PREGUNTAS;
const AVATARS_BUCKET = process.env.AVATARS_BUCKET;
const FILES_BUCKET = process.env.FILES_BUCKET;

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
const parseBody = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
};
async function withAvatarUrl(item) {
  if (item?.avatarKey && AVATARS_BUCKET) {
    try {
      item.photoURL = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: AVATARS_BUCKET, Key: item.avatarKey }),
        { expiresIn: 3600 }
      );
    } catch {
      /* omitir */
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
    const names = {}, values = {}, sets = [];
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
    const eventos = (Items ?? []).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return json(200, { eventos });
  }
  if (route === "POST /eventos") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { date, time, title, type, description, premium } = body;
    if (!date || !time || !title || !type) return json(400, { error: "Faltan campos" });
    if (!TYPES.includes(type)) return json(400, { error: `type debe ser: ${TYPES.join(", ")}` });
    const item = { id: randomUUID(), date, time, title, type, description: description ?? "", premium: Boolean(premium), createdBy: email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: EVENTS, Item: item }));
    return json(201, { evento: item });
  }
  if (route === "DELETE /eventos/{id}") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: EVENTS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ EPISODIOS ══════════
  if (route === "GET /episodios") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EPISODIOS }));
    const episodios = (Items ?? []).sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
    return json(200, { episodios });
  }
  if (route === "POST /episodios") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { number, title, description, showNotes, duration, date, premium, links } = body;
    if (!title || number == null) return json(400, { error: "Faltan campos: number, title" });
    const item = {
      id: randomUUID(),
      number: Number(number),
      title,
      description: description ?? "",
      showNotes: showNotes ?? "",
      duration: duration ?? "",
      date: date ?? "",
      premium: Boolean(premium),
      links: {
        spotify: links?.spotify ?? "",
        youtube: links?.youtube ?? "",
        apple: links?.apple ?? "",
      },
      createdBy: email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: EPISODIOS, Item: item }));
    return json(201, { episodio: item });
  }
  if (route === "PUT /episodios/{id}") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    const { Item } = await ddb.send(new GetCommand({ TableName: EPISODIOS, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    const updated = {
      ...Item,
      number: body.number != null ? Number(body.number) : Item.number,
      title: body.title ?? Item.title,
      description: body.description ?? Item.description,
      showNotes: body.showNotes ?? Item.showNotes,
      duration: body.duration ?? Item.duration,
      date: body.date ?? Item.date,
      premium: body.premium != null ? Boolean(body.premium) : Item.premium,
      links: body.links ? { spotify: body.links.spotify ?? "", youtube: body.links.youtube ?? "", apple: body.links.apple ?? "" } : Item.links,
    };
    await ddb.send(new PutCommand({ TableName: EPISODIOS, Item: updated }));
    return json(200, { episodio: updated });
  }
  if (route === "DELETE /episodios/{id}") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: EPISODIOS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ DESCARGAS (S3) ══════════
  if (route === "GET /descargas") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: DESCARGAS }));
    const descargas = await Promise.all(
      (Items ?? [])
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .map(async (d) => {
          let url = "";
          if (d.fileKey && FILES_BUCKET) {
            try {
              url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: FILES_BUCKET, Key: d.fileKey }), { expiresIn: 3600 });
            } catch { /* omitir */ }
          }
          return { ...d, url };
        })
    );
    return json(200, { descargas });
  }
  if (route === "POST /descargas-upload") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    if (!FILES_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const safe = String(body.filename || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const key = `descargas/${randomUUID()}-${safe}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: FILES_BUCKET, Key: key, ContentType: body.contentType || "application/octet-stream" }),
      { expiresIn: 600 }
    );
    return json(200, { uploadUrl, key });
  }
  if (route === "POST /descargas") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { title, type, fileKey, size } = body;
    if (!title || !fileKey) return json(400, { error: "Faltan campos: title, fileKey" });
    const item = { id: randomUUID(), title, type: type ?? "audio", fileKey, size: size ?? "", createdBy: email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: DESCARGAS, Item: item }));
    return json(201, { descarga: item });
  }
  if (route === "DELETE /descargas/{id}") {
    if ((await getRole(userId)) !== "admin") return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: DESCARGAS, Key: { id } }));
    if (Item?.fileKey && FILES_BUCKET) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: FILES_BUCKET, Key: Item.fileKey }));
      } catch { /* omitir */ }
    }
    await ddb.send(new DeleteCommand({ TableName: DESCARGAS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ PREGUNTAS / BUZÓN ══════════
  if (route === "POST /preguntas") {
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const contenido = String(body.contenido ?? "").trim();
    if (!contenido) return json(400, { error: "La pregunta está vacía" });
    const item = {
      id: randomUUID(),
      contenido: contenido.slice(0, 2000),
      fromUserId: userId,
      fromName: name || email,
      fromEmail: email,
      answered: false,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: PREGUNTAS, Item: item }));
    return json(201, { pregunta: item });
  }
  if (route === "GET /preguntas") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: PREGUNTAS }));
    const preguntas = (Items ?? []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json(200, { preguntas });
  }
  if (route === "PUT /preguntas/{id}") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    await ddb.send(
      new UpdateCommand({
        TableName: PREGUNTAS,
        Key: { id },
        UpdateExpression: "SET answered = :a",
        ExpressionAttributeValues: { ":a": Boolean(body.answered) },
      })
    );
    return json(200, { ok: true });
  }
  if (route === "DELETE /preguntas/{id}") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: PREGUNTAS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ REUNIONES ══════════
  if (route === "GET /reuniones") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: REUNIONES }));
    const reuniones = (Items ?? []).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return json(200, { reuniones });
  }
  if (route === "POST /reuniones") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { date, time, title, description, lugar } = body;
    if (!date || !time || !title) return json(400, { error: "Faltan campos" });
    const item = { id: randomUUID(), date, time, title, description: description ?? "", lugar: lugar ?? "", createdByUserId: userId, createdByName: name || email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: REUNIONES, Item: item }));
    return json(201, { reunion: item });
  }
  if (route === "DELETE /reuniones/{id}") {
    const role = await getRole(userId);
    if (!canParticipate(role)) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: REUNIONES, Key: { id } }));
    if (Item && Item.createdByUserId !== userId && role !== "admin") return json(403, { error: "Solo el autor o admin" });
    await ddb.send(new DeleteCommand({ TableName: REUNIONES, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ NOTAS ══════════
  if (route === "GET /notas") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: NOTAS }));
    const notas = (Items ?? []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json(200, { notas });
  }
  if (route === "POST /notas") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { titulo, contenido } = body;
    if (!contenido && !titulo) return json(400, { error: "La nota está vacía" });
    const item = { id: randomUUID(), titulo: (titulo ?? "").slice(0, 140), contenido: (contenido ?? "").slice(0, 4000), createdByUserId: userId, createdByName: name || email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: NOTAS, Item: item }));
    return json(201, { nota: item });
  }
  if (route === "DELETE /notas/{id}") {
    const role = await getRole(userId);
    if (!canParticipate(role)) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: NOTAS, Key: { id } }));
    if (Item && Item.createdByUserId !== userId && role !== "admin") return json(403, { error: "Solo el autor o admin" });
    await ddb.send(new DeleteCommand({ TableName: NOTAS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ USUARIOS / ROLES ══════════
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
    const targetId = event.pathParameters?.id;
    if (!body || !targetId || !ROLES.includes(body.role)) return json(400, { error: `role debe ser: ${ROLES.join(", ")}` });
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId: targetId },
        UpdateExpression: "SET #r = :r",
        ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":r": body.role },
      })
    );
    return json(200, { ok: true, userId: targetId, role: body.role });
  }

  return json(404, { error: "Ruta no encontrada" });
};
