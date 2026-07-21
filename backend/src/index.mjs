import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
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
const CONFIG = process.env.TABLE_CONFIG;
const PRODUCCION = process.env.TABLE_PRODUCCION;
const NOTIFICACIONES = process.env.TABLE_NOTIFICACIONES;
const AVATARS_BUCKET = process.env.AVATARS_BUCKET;
const FILES_BUCKET = process.env.FILES_BUCKET;
// Correo que siempre es super admin (bootstrap): se promueve al iniciar sesión.
const SUPERADMIN_EMAIL = (process.env.SUPERADMIN_EMAIL || "").trim().toLowerCase();

const TYPES = ["stream", "charla", "especial"];
const STAGES = ["idea", "guion", "grabacion", "edicion", "programado", "publicado"];
const STAGE_LABELS = { idea: "Idea", guion: "Guion", grabacion: "Grabación", edicion: "Edición", programado: "Programado", publicado: "Publicado" };
const ESTADOS = ["pendiente", "en_progreso", "en_revision", "aprobada"];

// ── Plantillas tipadas por etapa (contrato de entrega) ──
// Cada etapa entrega campos TIPADOS que consume la etapa siguiente. La "Definición
// de Hecho" (Definition of Done) exige que todos los campos `required` estén completos
// antes de pasar a "aprobada" — se valida en el backend (fuente de verdad).
// Tipos: texto | texto-largo | fecha | numero | select | checkbox | url | file
const FIELD_TYPES = ["texto", "texto-largo", "fecha", "numero", "select", "checkbox", "url", "file"];
const STAGE_TEMPLATES = {
  idea: {
    version: 1,
    entrega: "Para el guionista",
    fields: [
      { key: "tema", label: "Tema central", type: "texto", required: true },
      { key: "tipo", label: "Tipo de episodio", type: "select", required: true, options: ["Entrevista", "Debate", "Solo", "Especial"] },
      { key: "angulo", label: "Ángulo / enfoque", type: "texto-largo", required: true },
      { key: "invitado", label: "Invitado propuesto", type: "texto", required: false },
      { key: "referencias", label: "Referencias / links", type: "texto-largo", required: false },
    ],
  },
  guion: {
    version: 1,
    entrega: "Para quien graba",
    fields: [
      { key: "gancho", label: "Gancho de apertura", type: "texto-largo", required: true },
      { key: "bloques", label: "Estructura por bloques", type: "texto-largo", required: true },
      { key: "duracion", label: "Duración estimada (min)", type: "numero", required: false },
      { key: "documento", label: "Guion (documento)", type: "file", required: true },
    ],
  },
  grabacion: {
    version: 1,
    entrega: "Para el editor",
    fields: [
      { key: "fecha_grab", label: "Fecha de grabación", type: "fecha", required: true },
      { key: "lugar", label: "Lugar / estudio", type: "texto", required: false },
      { key: "crudo", label: "Audio/video crudo", type: "file", required: true },
      { key: "notas_edicion", label: "Notas para edición", type: "texto-largo", required: false },
    ],
  },
  edicion: {
    version: 1,
    entrega: "Para quien programa",
    fields: [
      { key: "master", label: "Master final (audio/video)", type: "file", required: true },
      { key: "duracion_final", label: "Duración final (min)", type: "numero", required: false },
      { key: "notas", label: "Notas de la edición", type: "texto-largo", required: false },
    ],
  },
  programado: {
    version: 1,
    entrega: "Para publicar",
    fields: [
      { key: "titulo_pub", label: "Título de publicación", type: "texto", required: true },
      { key: "descripcion", label: "Descripción / show notes", type: "texto-largo", required: true },
      { key: "fecha_pub", label: "Fecha de publicación", type: "fecha", required: true },
      { key: "portada", label: "Portada / miniatura", type: "file", required: false },
      { key: "plataformas", label: "Plataformas (Spotify, YouTube…)", type: "texto", required: false },
    ],
  },
  publicado: {
    version: 1,
    entrega: "Cierre",
    fields: [
      { key: "url_youtube", label: "Enlace YouTube", type: "url", required: false },
      { key: "url_spotify", label: "Enlace Spotify", type: "url", required: false },
      { key: "publicado_ok", label: "Confirmar publicado", type: "checkbox", required: true },
    ],
  },
};
const isFileField = (stage, key) => (STAGE_TEMPLATES[stage]?.fields ?? []).some((f) => f.key === key && f.type === "file");

// Normaliza/valida un valor según el tipo del campo. Devuelve el valor saneado.
function sanitizeFieldValue(type, raw) {
  switch (type) {
    case "numero": {
      if (raw === "" || raw == null) return "";
      const n = Number(raw);
      return Number.isFinite(n) ? n : "";
    }
    case "checkbox":
      return Boolean(raw);
    case "file":
      // { archivoKey, archivoNombre }
      if (raw && typeof raw === "object" && raw.archivoKey) {
        return { archivoKey: String(raw.archivoKey), archivoNombre: String(raw.archivoNombre ?? "archivo").slice(0, 160) };
      }
      return null;
    default:
      return String(raw ?? "").slice(0, 4000);
  }
}
// ¿El valor cuenta como "completo" para un campo requerido?
function fieldFilled(type, val) {
  if (type === "checkbox") return val === true;
  if (type === "numero") return val !== "" && val != null && Number.isFinite(Number(val));
  if (type === "file") return !!(val && val.archivoKey);
  return typeof val === "string" && val.trim() !== "";
}
// Devuelve las etiquetas de campos requeridos que faltan para aprobar la etapa.
function faltantesParaAprobar(stage, values) {
  const tpl = STAGE_TEMPLATES[stage];
  if (!tpl) return [];
  return tpl.fields.filter((f) => f.required && !fieldFilled(f.type, values?.[f.key])).map((f) => f.label);
}
const ROLES = ["miembro", "participante", "admin", "superadmin"];
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
const canParticipate = (role) => role === "participante" || role === "admin" || role === "superadmin";
// Gestión de contenido del sitio (eventos, episodios, descargas, en vivo…).
const canAdmin = (role) => role === "admin" || role === "superadmin";
// Solo el super admin: ve usuarios registrados y asigna/quita roles.
const isSuperAdmin = (role) => role === "superadmin";
const parseBody = (event) => {
  try {
    return JSON.parse(event.body || "{}");
  } catch {
    return null;
  }
};

// Crea una notificación in-app para un usuario.
async function notify(targetUserId, texto, meta = {}) {
  if (!NOTIFICACIONES || !targetUserId) return;
  const now = new Date().toISOString();
  const id = randomUUID();
  await ddb.send(new PutCommand({
    TableName: NOTIFICACIONES,
    Item: {
      userId: targetUserId,
      sk: `${now}#${id}`,
      id, texto,
      episodioId: meta.episodioId ?? "",
      episodioTitulo: meta.episodioTitulo ?? "",
      stage: meta.stage ?? "",
      leida: false,
      createdAt: now,
    },
  }));
}
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
          "SET email = :e, #n = :n, lastLogin = :t, createdAt = if_not_exists(createdAt, :t), #r = if_not_exists(#r, :role), #p = if_not_exists(#p, :plan)",
        ExpressionAttributeNames: { "#n": "name", "#r": "role", "#p": "plan" },
        ExpressionAttributeValues: { ":e": email, ":n": name, ":t": now, ":role": "miembro", ":plan": "free" },
      })
    );
    // Bootstrap del super admin por correo: se promueve automáticamente al entrar.
    if (SUPERADMIN_EMAIL && email.toLowerCase() === SUPERADMIN_EMAIL) {
      await ddb.send(new UpdateCommand({
        TableName: USERS, Key: { userId },
        UpdateExpression: "SET #r = :sa", ExpressionAttributeNames: { "#r": "role" },
        ExpressionAttributeValues: { ":sa": "superadmin" },
      }));
    }
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

  // ══════════ SUSCRIPCIÓN (MercadoPago — MOCK) ══════════
  // Estructura pensada para reemplazar el mock por el SDK real de MercadoPago:
  //  - /preferencia  → hoy devuelve datos simulados; en real crea una "preference".
  //  - /pagar        → hoy marca premium al instante; en real lo hace el webhook
  //                    de MercadoPago tras verificar el pago aprobado.
  const PLAN_PRECIO = { amount: 4990, currency: "CLP", plan: "premium" };

  if (route === "POST /suscripcion/preferencia") {
    return json(200, {
      preferenceId: `mock-${randomUUID()}`,
      ...PLAN_PRECIO,
      mock: true,
    });
  }
  if (route === "POST /suscripcion/pagar") {
    // MOCK: aquí, en producción, se validaría el pago con MercadoPago.
    const now = new Date().toISOString();
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression: "SET #p = :premium, premiumSince = if_not_exists(premiumSince, :t)",
        ExpressionAttributeNames: { "#p": "plan" },
        ExpressionAttributeValues: { ":premium": "premium", ":t": now },
      })
    );
    const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
    return json(200, { user: await withAvatarUrl(Item), mock: true });
  }
  if (route === "POST /suscripcion/cancelar") {
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression: "SET #p = :free REMOVE premiumSince",
        ExpressionAttributeNames: { "#p": "plan" },
        ExpressionAttributeValues: { ":free": "free" },
      })
    );
    const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
    return json(200, { user: await withAvatarUrl(Item) });
  }

  // ══════════ EVENTOS ══════════
  if (route === "GET /eventos") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EVENTS }));
    const eventos = (Items ?? []).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return json(200, { eventos });
  }
  if (route === "POST /eventos") {
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
              const nombre = String(d.filename || d.title || "archivo").replace(/"/g, "");
              url = await getSignedUrl(
                s3,
                new GetObjectCommand({
                  Bucket: FILES_BUCKET,
                  Key: d.fileKey,
                  ResponseContentDisposition: `attachment; filename="${nombre}"`,
                }),
                { expiresIn: 3600 }
              );
            } catch { /* omitir */ }
          }
          return { ...d, url };
        })
    );
    return json(200, { descargas });
  }
  if (route === "POST /descargas-upload") {
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { title, type, fileKey, size, filename, premium } = body;
    if (!title || !fileKey) return json(400, { error: "Faltan campos: title, fileKey" });
    const item = { id: randomUUID(), title, type: type ?? "audio", fileKey, size: size ?? "", filename: filename ?? "", premium: Boolean(premium), createdBy: email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: DESCARGAS, Item: item }));
    return json(201, { descarga: item });
  }
  if (route === "DELETE /descargas/{id}") {
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
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

  // ══════════ EN VIVO (config) ══════════
  if (route === "GET /live") {
    const { Item } = await ddb.send(new GetCommand({ TableName: CONFIG, Key: { id: "live" } }));
    return json(200, {
      live: {
        isLive: Boolean(Item?.isLive),
        videoId: Item?.videoId ?? "",
        title: Item?.title ?? "",
        platform: Item?.platform ?? "youtube",
      },
    });
  }
  if (route === "PUT /live") {
    if (!canAdmin(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const item = {
      id: "live",
      isLive: Boolean(body.isLive),
      videoId: String(body.videoId ?? "").slice(0, 40),
      title: String(body.title ?? "").slice(0, 200),
      platform: body.platform ?? "youtube",
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: CONFIG, Item: item }));
    return json(200, { live: item });
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
    if (Item && Item.createdByUserId !== userId && !canAdmin(role)) return json(403, { error: "Solo el autor o admin" });
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
    if (Item && Item.createdByUserId !== userId && !canAdmin(role)) return json(403, { error: "Solo el autor o admin" });
    await ddb.send(new DeleteCommand({ TableName: NOTAS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ PRODUCCIÓN (episodios con etapas) ══════════
  const emptyStage = (stage) => ({
    responsable: "", responsableId: "", fecha: "", estado: "pendiente", subtareas: [], done: false,
    values: {}, templateVersion: STAGE_TEMPLATES[stage]?.version ?? 1, historial: [],
  });

  const signedGetUrl = (key, nombre) => getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: FILES_BUCKET, Key: key, ResponseContentDisposition: `attachment; filename="${String(nombre || "archivo").replace(/"/g, "")}"` }),
    { expiresIn: 3600 }
  );

  // Agrega archivoUrl (URL firmada) a los campos tipo `file` de cada etapa.
  async function withStageUrls(item) {
    if (!item?.stages || !FILES_BUCKET) return item;
    for (const s of STAGES) {
      const st = item.stages[s];
      if (!st) continue;
      // Campos tipados tipo `file` dentro de values.
      for (const [k, v] of Object.entries(st.values ?? {})) {
        if (isFileField(s, k) && v && v.archivoKey) {
          try { v.archivoUrl = await signedGetUrl(v.archivoKey, v.archivoNombre); } catch { /* omitir */ }
        }
      }
      // Compat: adjunto legacy a nivel de etapa.
      if (st.archivoKey) {
        try { st.archivoUrl = await signedGetUrl(st.archivoKey, st.archivoNombre); } catch { /* omitir */ }
      }
    }
    return item;
  }

  if (route === "GET /plantillas") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    return json(200, { plantillas: STAGE_TEMPLATES, tipos: FIELD_TYPES });
  }

  if (route === "GET /produccion") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: PRODUCCION }));
    const items = (Items ?? []).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const produccion = await Promise.all(items.map((i) => withStageUrls(i)));
    return json(200, { produccion });
  }

  if (route === "POST /produccion-upload") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    if (!FILES_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const safe = String(body.filename || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const key = `produccion/${randomUUID()}-${safe}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: FILES_BUCKET, Key: key, ContentType: body.contentType || "application/octet-stream" }),
      { expiresIn: 600 }
    );
    return json(200, { uploadUrl, key });
  }

  if (route === "POST /produccion") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const titulo = String(body.titulo ?? "").trim();
    if (!titulo) return json(400, { error: "Falta el título" });
    const idea = String(body.idea ?? "").slice(0, 4000);
    const stages = {};
    for (const s of STAGES) stages[s] = emptyStage(s);
    // El brief inicial mapea al campo "tema" de la etapa Idea (contrato tipado).
    stages.idea = { ...emptyStage("idea"), responsable: name || email, responsableId: userId, values: idea ? { tema: idea } : {} };
    const item = {
      id: randomUUID(),
      titulo: titulo.slice(0, 160),
      stages,
      createdByUserId: userId,
      createdByName: name || email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: PRODUCCION, Item: item }));
    return json(201, { item: await withStageUrls(item) });
  }

  if (route === "PUT /produccion/{id}") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    const { Item } = await ddb.send(new GetCommand({ TableName: PRODUCCION, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    const stages = { ...(Item.stages ?? {}) };
    let notiAsignar = null;
    let notiHandoff = null;
    if (STAGES.includes(body.stage) && body.stageData) {
      const cur = { ...emptyStage(body.stage), ...(stages[body.stage] ?? {}) };
      const d = body.stageData;
      const estado = ESTADOS.includes(d.estado) ? d.estado : (cur.estado ?? "pendiente");
      const subtareas = Array.isArray(d.subtareas)
        ? d.subtareas.slice(0, 60).map((t) => ({ id: String(t.id ?? randomUUID()).slice(0, 40), texto: String(t.texto ?? "").slice(0, 300), desc: String(t.desc ?? "").slice(0, 2000), hecha: Boolean(t.hecha) }))
        : (cur.subtareas ?? []);

      // Fusiona valores tipados según la plantilla de la etapa (ignora claves desconocidas).
      const tpl = STAGE_TEMPLATES[body.stage];
      const values = { ...(cur.values ?? {}) };
      if (d.values && typeof d.values === "object") {
        for (const f of tpl.fields) {
          if (Object.prototype.hasOwnProperty.call(d.values, f.key)) {
            values[f.key] = sanitizeFieldValue(f.type, d.values[f.key]);
          }
        }
      }

      // ── Gate de Definición de Hecho: no se puede aprobar con campos requeridos vacíos ──
      if (estado === "aprobada" && cur.estado !== "aprobada") {
        const faltan = faltantesParaAprobar(body.stage, values);
        if (faltan.length > 0) {
          return json(400, {
            error: "No se puede aprobar: faltan campos obligatorios de la plantilla.",
            faltantes: faltan,
            stage: body.stage,
          });
        }
      }

      // ── Historial auditado de transiciones de estado ──
      const historial = Array.isArray(cur.historial) ? cur.historial.slice(-49) : [];
      if (estado !== cur.estado) {
        historial.push({ de: cur.estado ?? "pendiente", a: estado, porUserId: userId, porNombre: name || email, cuando: new Date().toISOString() });
      }

      const newStage = {
        responsable: d.responsable != null ? String(d.responsable).slice(0, 80) : (cur.responsable ?? ""),
        responsableId: d.responsableId != null ? String(d.responsableId).slice(0, 60) : (cur.responsableId ?? ""),
        fecha: d.fecha != null ? String(d.fecha) : (cur.fecha ?? ""),
        estado,
        subtareas,
        values,
        templateVersion: tpl.version,
        historial,
        done: estado === "aprobada",
      };
      stages[body.stage] = newStage;

      // Notificación de asignación (a quien le tocó, si cambió y no es uno mismo).
      if (newStage.responsableId && newStage.responsableId !== cur.responsableId && newStage.responsableId !== userId) {
        notiAsignar = { to: newStage.responsableId, texto: `Te asignaron la etapa "${STAGE_LABELS[body.stage]}" de "${Item.titulo}"`, stage: body.stage };
      }
      // Handoff: al aprobar una etapa, avisar al responsable de la siguiente.
      if (estado === "aprobada" && cur.estado !== "aprobada") {
        const idx = STAGES.indexOf(body.stage);
        const next = STAGES[idx + 1];
        const nextStage = next ? stages[next] : null;
        if (nextStage?.responsableId && nextStage.responsableId !== userId) {
          notiHandoff = { to: nextStage.responsableId, texto: `"${STAGE_LABELS[body.stage]}" de "${Item.titulo}" quedó lista — te toca "${STAGE_LABELS[next]}"`, stage: next };
        }
      }
    }
    const updated = { ...Item, titulo: body.titulo != null ? String(body.titulo).slice(0, 160) : Item.titulo, stages };
    await ddb.send(new PutCommand({ TableName: PRODUCCION, Item: updated }));
    if (notiAsignar) await notify(notiAsignar.to, notiAsignar.texto, { episodioId: id, episodioTitulo: Item.titulo, stage: notiAsignar.stage });
    if (notiHandoff) await notify(notiHandoff.to, notiHandoff.texto, { episodioId: id, episodioTitulo: Item.titulo, stage: notiHandoff.stage });
    return json(200, { item: await withStageUrls(updated) });
  }

  if (route === "DELETE /produccion/{id}") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: PRODUCCION, Key: { id } }));
    if (Item?.stages && FILES_BUCKET) {
      const keys = [];
      for (const s of STAGES) {
        const st = Item.stages[s];
        if (st?.archivoKey) keys.push(st.archivoKey);
        for (const [k, v] of Object.entries(st?.values ?? {})) {
          if (isFileField(s, k) && v?.archivoKey) keys.push(v.archivoKey);
        }
      }
      for (const key of keys) { try { await s3.send(new DeleteObjectCommand({ Bucket: FILES_BUCKET, Key: key })); } catch { /* omitir */ } }
    }
    await ddb.send(new DeleteCommand({ TableName: PRODUCCION, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ EQUIPO (para asignar responsables) ══════════
  if (route === "GET /equipo") {
    if (!canParticipate(await getRole(userId))) return json(403, { error: "Solo participantes" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
    const equipo = (Items ?? [])
      .filter((u) => u.role === "participante" || u.role === "admin" || u.role === "superadmin")
      .map((u) => ({ userId: u.userId, nombre: u.apodo || u.name || u.email || "Sin nombre" }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    return json(200, { equipo });
  }

  // ══════════ NOTIFICACIONES (in-app) ══════════
  if (route === "GET /notificaciones") {
    const { Items } = await ddb.send(new QueryCommand({
      TableName: NOTIFICACIONES,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
      ScanIndexForward: false,
      Limit: 40,
    }));
    return json(200, { notificaciones: Items ?? [] });
  }
  if (route === "POST /notificaciones/leer") {
    const { Items } = await ddb.send(new QueryCommand({
      TableName: NOTIFICACIONES,
      KeyConditionExpression: "userId = :u",
      FilterExpression: "leida = :f",
      ExpressionAttributeValues: { ":u": userId, ":f": false },
      Limit: 50,
    }));
    for (const it of Items ?? []) {
      await ddb.send(new UpdateCommand({
        TableName: NOTIFICACIONES,
        Key: { userId, sk: it.sk },
        UpdateExpression: "SET leida = :t",
        ExpressionAttributeValues: { ":t": true },
      }));
    }
    return json(200, { ok: true });
  }

  // ══════════ USUARIOS / ROLES (solo super admin) ══════════
  if (route === "GET /usuarios") {
    if (!isSuperAdmin(await getRole(userId))) return json(403, { error: "Solo el super admin" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
    const usuarios = (Items ?? [])
      .map((u) => ({ userId: u.userId, email: u.email, name: u.name, role: u.role ?? "miembro" }))
      .sort((a, b) => String(a.email).localeCompare(String(b.email)));
    return json(200, { usuarios });
  }
  if (route === "PUT /usuarios/{id}/role") {
    if (!isSuperAdmin(await getRole(userId))) return json(403, { error: "Solo el super admin" });
    const body = parseBody(event);
    const targetId = event.pathParameters?.id;
    if (!body || !targetId || !ROLES.includes(body.role)) return json(400, { error: `role debe ser: ${ROLES.join(", ")}` });
    // Evitar que el super admin se quite su propio rol y pierda el acceso.
    if (targetId === userId && body.role !== "superadmin") return json(400, { error: "No puedes cambiar tu propio rol de super admin" });
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
