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
const LUGARES = process.env.TABLE_LUGARES;
const REDES = process.env.TABLE_REDES;
const LIVES = process.env.TABLE_LIVES;
const SECCIONES = process.env.TABLE_SECCIONES;
const AVATARS_BUCKET = process.env.AVATARS_BUCKET;
const FILES_BUCKET = process.env.FILES_BUCKET;
// Email que recibe rol admin la primera vez que entra (ver bootstrap en GET /me).
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

// Tipos de contenido en agenda/calendario.
const TYPES = ["en_vivo", "grabacion", "publicacion", "colaboracion", "evento"];
// Formatos de contenido del creador (usados en la planilla de la etapa "idea").
const FORMATOS = ["Reel", "Video largo", "En vivo", "Visita a lugar", "Colaboración", "Carrusel de fotos", "Historia"];
// Categorías del catálogo de locales del ambiente.
const CATEGORIAS_LUGAR = ["club", "sauna", "hotel", "bar", "evento", "fiesta_privada", "tienda", "taller", "otro"];
// Redes sociales soportadas en el promocional.
const PLATAFORMAS = ["instagram", "tiktok", "youtube", "twitch", "x", "facebook", "kick", "spotify"];
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
    version: 2,
    entrega: "Para quien escribe el guion",
    fields: [
      { key: "concepto", label: "Concepto del contenido", type: "texto", required: true },
      { key: "formato", label: "Formato", type: "select", required: true, options: FORMATOS },
      { key: "plataformas", label: "Plataformas destino", type: "texto", required: true },
      { key: "gancho_idea", label: "¿Por qué alguien se detendría a verlo?", type: "texto-largo", required: true },
      { key: "lugar_tentativo", label: "Lugar tentativo", type: "texto", required: false },
      { key: "referencias", label: "Referencias / links", type: "texto-largo", required: false },
    ],
  },
  guion: {
    version: 2,
    entrega: "Para quien graba",
    fields: [
      { key: "hook", label: "Hook (primeros 3 segundos)", type: "texto-largo", required: true },
      { key: "storyboard", label: "Storyboard / plano a plano", type: "texto-largo", required: true },
      { key: "cta", label: "Llamado a la acción", type: "texto", required: true },
      { key: "duracion", label: "Duración estimada (seg)", type: "numero", required: false },
      { key: "documento", label: "Guion (documento)", type: "file", required: false },
    ],
  },
  grabacion: {
    version: 2,
    entrega: "Para quien edita",
    fields: [
      { key: "fecha_grab", label: "Fecha de grabación", type: "fecha", required: true },
      { key: "lugar", label: "Lugar / ubicación", type: "texto", required: false },
      { key: "crudo", label: "Material crudo (video)", type: "file", required: true },
      { key: "fotos", label: "Fotos del rodaje", type: "file", required: false },
      { key: "notas_edicion", label: "Notas para edición", type: "texto-largo", required: false },
    ],
  },
  edicion: {
    version: 2,
    entrega: "Para quien programa",
    fields: [
      { key: "master", label: "Master final (video)", type: "file", required: true },
      { key: "relacion", label: "Relación de aspecto", type: "select", required: true, options: ["9:16 (vertical)", "1:1 (cuadrado)", "16:9 (horizontal)"] },
      { key: "subtitulos", label: "Lleva subtítulos", type: "checkbox", required: false },
      { key: "musica", label: "Música / audio usado", type: "texto", required: false },
      { key: "notas", label: "Notas de la edición", type: "texto-largo", required: false },
    ],
  },
  programado: {
    version: 2,
    entrega: "Para publicar",
    fields: [
      { key: "copy", label: "Copy de la publicación", type: "texto-largo", required: true },
      { key: "hashtags", label: "Hashtags", type: "texto", required: false },
      { key: "fecha_pub", label: "Fecha de publicación", type: "fecha", required: true },
      { key: "hora_pub", label: "Hora de publicación", type: "texto", required: false },
      { key: "portada", label: "Portada / miniatura", type: "file", required: false },
      { key: "plataformas_pub", label: "Dónde se publica", type: "texto", required: true },
      { key: "colaboradores", label: "Colaboradores / menciones", type: "texto", required: false },
    ],
  },
  publicado: {
    version: 2,
    entrega: "Cierre",
    fields: [
      { key: "url_instagram", label: "Enlace Instagram", type: "url", required: false },
      { key: "url_tiktok", label: "Enlace TikTok", type: "url", required: false },
      { key: "url_youtube", label: "Enlace YouTube", type: "url", required: false },
      { key: "vistas", label: "Vistas a las 48 h", type: "numero", required: false },
      { key: "likes", label: "Likes a las 48 h", type: "numero", required: false },
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
// Jerarquía editorial del medio swinger. El índice es el rango: a mayor índice,
// más permisos. super_admin es único (lo fija ADMIN_EMAIL en el bootstrap).
//   miembro     → lee.
//   influencer  → publica en las secciones que le asignaron.
//   editor      → publica/edita en cualquier sección y modera.
//   admin       → gestiona secciones, usuarios y asignaciones.
//   super_admin → control total. Solo uno.
// "local" es un rol lateral: dueño de un local (bar, sauna…) que gestiona su
// propia ficha y sus eventos. No es staff editorial ni gestiona el sitio; se
// ubica apenas por encima de miembro para el sistema de rangos.
const ROLES = ["miembro", "local", "influencer", "editor", "admin", "super_admin"];
const RANK = Object.fromEntries(ROLES.map((r, i) => [r, i]));
const rankOf = (role) => RANK[role] ?? 0;
/** ¿`role` alcanza al menos el rango mínimo pedido? */
const atLeast = (role, min) => rankOf(role) >= rankOf(min);
const isStaff = (role) => atLeast(role, "influencer"); // puede publicar artículos
const canManage = (role) => atLeast(role, "admin");    // gestiona el sitio
const isLocal = (role) => role === "local";            // dueño de un local
const isSuperAdmin = (role) => role === "super_admin"; // único; gestiona usuarios/roles
const PROFILE_FIELDS = ["apodo", "pais", "region", "telefono", "alias", "bio", "instagram"];

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
// Compat: "participar" (buzón, notas, reuniones) = ser parte del staff.
const canParticipate = (role) => isStaff(role);
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

// Convierte un nombre en slug URL-safe: "Arte Erótico" → "arte-erotico".
function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Normaliza el cuerpo de un lugar. Deja fuera id/createdAt para no pisarlos al editar.
function lugarFields(b) {
  const fotos = Array.isArray(b.fotos) ? b.fotos : [];
  const eventos = Array.isArray(b.eventos) ? b.eventos : [];
  const rating = Number(b.rating);
  return {
    categoria: b.categoria,
    direccion: String(b.direccion ?? "").slice(0, 300),
    ciudad: String(b.ciudad ?? "").slice(0, 120),
    mapsUrl: String(b.mapsUrl ?? "").slice(0, 400),
    // Datos que carga el propio local.
    horario: String(b.horario ?? "").slice(0, 600),
    telefono: String(b.telefono ?? "").slice(0, 40),
    web: String(b.web ?? "").slice(0, 300),
    descripcion: String(b.descripcion ?? "").slice(0, 4000),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
    resena: String(b.resena ?? "").slice(0, 4000),
    precio: String(b.precio ?? "").slice(0, 10),
    recomendado: Boolean(b.recomendado),
    visitadoEl: String(b.visitadoEl ?? "").slice(0, 10),
    contenidoId: String(b.contenidoId ?? "").slice(0, 80),
    contenidoUrl: String(b.contenidoUrl ?? "").slice(0, 300),
    fotos: fotos
      .slice(0, 12)
      .filter((f) => f && typeof f === "object" && f.key)
      .map((f) => ({ key: String(f.key).slice(0, 300), nombre: String(f.nombre ?? "foto").slice(0, 160) })),
    // Eventos del local: fecha (YYYY-MM-DD), título, descripción y hora opcional.
    eventos: eventos
      .slice(0, 60)
      .filter((e) => e && typeof e === "object" && e.fecha && e.titulo)
      .map((e) => ({
        id: String(e.id || randomUUID()),
        fecha: String(e.fecha).slice(0, 10),
        hora: String(e.hora ?? "").slice(0, 5),
        titulo: String(e.titulo).slice(0, 160),
        descripcion: String(e.descripcion ?? "").slice(0, 600),
      })),
  };
}

// Firma las URLs de lectura de cada foto para que el navegador pueda mostrarlas.
async function withLugarUrls(lugar) {
  if (!lugar?.fotos?.length || !FILES_BUCKET) return { ...lugar, fotos: lugar?.fotos ?? [] };
  const fotos = await Promise.all(
    lugar.fotos.map(async (f) => {
      try {
        const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: FILES_BUCKET, Key: f.key }), { expiresIn: 3600 });
        return { ...f, url };
      } catch {
        return { ...f, url: "" };
      }
    })
  );
  return { ...lugar, fotos };
}

// Firma la URL de lectura de la portada de un artículo, si tiene.
async function withCoverUrl(item) {
  if (item?.coverKey && FILES_BUCKET) {
    try {
      item.coverUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: FILES_BUCKET, Key: item.coverKey }), { expiresIn: 3600 });
    } catch { /* omitir */ }
  }
  return item;
}
// Devuelve el item completo del usuario (rol + secciones asignadas).
async function getUser(userId) {
  const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId } }));
  return Item ?? null;
}
// Busca un usuario por email (case-insensitive). Devuelve el item o null.
async function findUserByEmail(email) {
  const e = String(email ?? "").trim().toLowerCase();
  if (!e) return null;
  const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
  return (Items ?? []).find((u) => String(u.email ?? "").toLowerCase() === e) ?? null;
}
// Vincula (o desvincula) el local que administra un usuario. Espejo de ownerId,
// para saber en /me si el usuario administra un local sin escanear lugares.
async function setUserLocalId(uid, localId) {
  if (!uid) return;
  if (localId) {
    await ddb.send(new UpdateCommand({ TableName: USERS, Key: { userId: uid }, UpdateExpression: "SET localId = :l", ExpressionAttributeValues: { ":l": localId } }));
  } else {
    await ddb.send(new UpdateCommand({ TableName: USERS, Key: { userId: uid }, UpdateExpression: "REMOVE localId" }));
  }
}
// ¿Este usuario puede publicar en esta sección?
// Editor y superiores: en cualquiera. Influencer: solo en las asignadas.
function puedeEnSeccion(user, seccionId) {
  const role = user?.role ?? "miembro";
  if (atLeast(role, "editor")) return true;
  if (role !== "influencer") return false;
  return Array.isArray(user.secciones) && user.secciones.includes(seccionId);
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
    // Bootstrap del super admin: con la tabla de usuarios vacía nadie puede
    // promover a nadie, porque cambiar roles ya exige ser admin. Si el email
    // del token coincide con ADMIN_EMAIL, el rol inicial es super_admin (único).
    // Solo aplica al crear el usuario (if_not_exists), así que no puede usarse
    // para reescalar el rol de una cuenta que ya existe.
    const esSuperAdminInicial =
      ADMIN_EMAIL && email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression:
          "SET email = :e, #n = :n, lastLogin = :t, createdAt = if_not_exists(createdAt, :t), #r = if_not_exists(#r, :role), #p = if_not_exists(#p, :plan)",
        ExpressionAttributeNames: { "#n": "name", "#r": "role", "#p": "plan" },
        ExpressionAttributeValues: {
          ":e": email,
          ":n": name,
          ":t": now,
          ":role": esSuperAdminInicial ? "super_admin" : "miembro",
          ":plan": "free",
        },
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
        // La bio del influencer admite texto largo; el resto, campos cortos.
        values[`:${f}`] = body[f].trim().slice(0, f === "bio" ? 2000 : 120);
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
    const propios = Items ?? [];
    // Fusiona los eventos de los locales APROBADOS en la agenda general.
    const { Items: locales } = await ddb.send(new ScanCommand({ TableName: LUGARES }));
    const deLocales = (locales ?? [])
      .filter((l) => l.aprobado && Array.isArray(l.eventos))
      .flatMap((l) =>
        l.eventos.map((e) => ({
          id: `local:${l.id}:${e.id}`,
          date: e.fecha,
          time: e.hora || "",
          title: `${l.nombre}: ${e.titulo}`,
          type: "evento",
          description: e.descripcion || "",
          premium: false,
          source: "local",
          lugarId: l.id,
          lugarNombre: l.nombre,
        }))
      );
    const eventos = [...propios, ...deLocales].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    return json(200, { eventos });
  }
  if (route === "POST /eventos") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: EVENTS, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ ARTÍCULOS (ruta histórica /episodios) ══════════
  // Cada artículo pertenece a una SECCIÓN y tiene un AUTOR (influencer del staff).
  // Estado borrador|publicado: el público solo ve publicados; el staff ve además
  // sus propios borradores; editor/admin ven todo.
  const normalizaLinks = (l) => ({ instagram: l?.instagram ?? "", tiktok: l?.tiktok ?? "", youtube: l?.youtube ?? "" });

  if (route === "GET /episodios") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EPISODIOS }));
    const rol = await getRole(userId);
    const qs = event.queryStringParameters ?? {};
    let visibles = (Items ?? []).filter((a) => {
      const publicado = (a.estado ?? "publicado") === "publicado";
      if (atLeast(rol, "editor")) return true;          // ve todo
      if (publicado) return true;                        // publicado lo ve cualquiera
      return a.autorId === userId;                        // su propio borrador
    });
    if (qs.seccion) visibles = visibles.filter((a) => a.seccion === qs.seccion);
    if (qs.autor) visibles = visibles.filter((a) => a.autorId === qs.autor);
    const episodios = await Promise.all(
      visibles
        .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt)))
        .map(withCoverUrl)
    );
    return json(200, { episodios });
  }
  if (route === "POST /episodios") {
    const user = await getUser(userId);
    if (!isStaff(user?.role)) return json(403, { error: "Solo el staff puede publicar" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const title = String(body.title ?? "").trim();
    const seccion = String(body.seccion ?? "");
    if (!title) return json(400, { error: "Falta el título" });
    if (!seccion) return json(400, { error: "Falta la sección" });
    if (!puedeEnSeccion(user, seccion)) return json(403, { error: "No tienes permiso para publicar en esa sección" });
    const estado = body.estado === "publicado" ? "publicado" : "borrador";
    const now = new Date().toISOString();
    const item = {
      id: randomUUID(),
      title: title.slice(0, 200),
      seccion,
      resumen: String(body.resumen ?? "").slice(0, 400),
      cuerpo: String(body.cuerpo ?? "").slice(0, 20000),
      coverKey: body.coverKey ? String(body.coverKey).slice(0, 300) : "",
      estado,
      autorId: userId,
      autorNombre: user.alias || user.name || email || "Anónimo/a",
      number: body.number != null && body.number !== "" ? Number(body.number) : undefined,
      premium: Boolean(body.premium),
      links: normalizaLinks(body.links),
      createdAt: now,
      publishedAt: estado === "publicado" ? now : "",
    };
    await ddb.send(new PutCommand({ TableName: EPISODIOS, Item: item }));
    return json(201, { episodio: await withCoverUrl(item) });
  }
  if (route === "PUT /episodios/{id}") {
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    const { Item } = await ddb.send(new GetCommand({ TableName: EPISODIOS, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    const user = await getUser(userId);
    // Puede editar: el autor del artículo, o editor/admin.
    const esAutor = Item.autorId === userId;
    if (!esAutor && !atLeast(user?.role, "editor")) return json(403, { error: "No puedes editar este artículo" });
    const seccion = body.seccion != null ? String(body.seccion) : Item.seccion;
    // Si cambia la sección, el autor debe poder publicar en la nueva.
    if (seccion !== Item.seccion && esAutor && !puedeEnSeccion(user, seccion))
      return json(403, { error: "No tienes permiso para esa sección" });
    const nuevoEstado = body.estado === "publicado" ? "publicado" : body.estado === "borrador" ? "borrador" : (Item.estado ?? "borrador");
    const yaPublicado = (Item.estado ?? "publicado") === "publicado";
    const updated = {
      ...Item,
      title: body.title != null ? String(body.title).trim().slice(0, 200) || Item.title : Item.title,
      seccion,
      resumen: body.resumen != null ? String(body.resumen).slice(0, 400) : Item.resumen,
      cuerpo: body.cuerpo != null ? String(body.cuerpo).slice(0, 20000) : Item.cuerpo,
      coverKey: body.coverKey != null ? String(body.coverKey).slice(0, 300) : Item.coverKey,
      estado: nuevoEstado,
      number: body.number != null ? (body.number === "" ? undefined : Number(body.number)) : Item.number,
      premium: body.premium != null ? Boolean(body.premium) : Item.premium,
      links: body.links ? normalizaLinks(body.links) : (Item.links ?? normalizaLinks()),
      publishedAt: nuevoEstado === "publicado" ? (yaPublicado ? Item.publishedAt : new Date().toISOString()) : "",
    };
    await ddb.send(new PutCommand({ TableName: EPISODIOS, Item: updated }));
    return json(200, { episodio: await withCoverUrl(updated) });
  }
  if (route === "DELETE /episodios/{id}") {
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: EPISODIOS, Key: { id } }));
    if (!Item) return json(200, { ok: true });
    const user = await getUser(userId);
    if (Item.autorId !== userId && !atLeast(user?.role, "editor")) return json(403, { error: "No puedes borrar este artículo" });
    if (Item.coverKey && FILES_BUCKET) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: FILES_BUCKET, Key: Item.coverKey })); } catch { /* omitir */ }
    }
    await ddb.send(new DeleteCommand({ TableName: EPISODIOS, Key: { id } }));
    return json(200, { ok: true });
  }
  // Presigned PUT para la portada de un artículo (bucket de archivos, prefijo contenidos/).
  if (route === "POST /episodios-upload") {
    if (!isStaff(await getRole(userId))) return json(403, { error: "Solo el staff" });
    if (!FILES_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    const body = parseBody(event);
    const contentType = body?.contentType || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(contentType)) return json(400, { error: "Formato de imagen no permitido" });
    const safe = String(body?.filename || "portada").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const key = `contenidos/${randomUUID()}-${safe}`;
    const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: FILES_BUCKET, Key: key, ContentType: contentType }), { expiresIn: 600 });
    return json(200, { uploadUrl, key, contentType });
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
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const { title, type, fileKey, size, filename, premium } = body;
    if (!title || !fileKey) return json(400, { error: "Faltan campos: title, fileKey" });
    const item = { id: randomUUID(), title, type: type ?? "audio", fileKey, size: size ?? "", filename: filename ?? "", premium: Boolean(premium), createdBy: email, createdAt: new Date().toISOString() };
    await ddb.send(new PutCommand({ TableName: DESCARGAS, Item: item }));
    return json(201, { descarga: item });
  }
  if (route === "DELETE /descargas/{id}") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
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
      .filter((u) => isStaff(u.role))
      .map((u) => ({ userId: u.userId, nombre: u.alias || u.apodo || u.name || u.email || "Sin nombre" }))
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

  // ══════════ LUGARES (catálogo público de sitios visitados) ══════════
  // Los miembros ven solo los publicados; el equipo ve también los borradores.
  if (route === "GET /lugares") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: LUGARES }));
    const rol = await getRole(userId);
    const puedeVerTodo = canParticipate(rol); // staff+ ve todo (aprobados y pendientes)
    const visibles = (Items ?? []).filter((l) => puedeVerTodo || l.aprobado || l.ownerId === userId);
    const lugares = await Promise.all(
      visibles
        .sort((a, b) => String(b.visitadoEl || b.createdAt).localeCompare(String(a.visitadoEl || a.createdAt)))
        .map(withLugarUrls)
    );
    return json(200, { lugares });
  }
  // Ficha del local del usuario actual (rol "local"): su propia ficha o null.
  if (route === "GET /mi-local") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: LUGARES }));
    const mio = (Items ?? []).find((l) => l.ownerId === userId);
    return json(200, { lugar: mio ? await withLugarUrls(mio) : null });
  }
  if (route === "POST /lugares") {
    const rol = await getRole(userId);
    if (!isLocal(rol) && !canParticipate(rol)) return json(403, { error: "No autorizado" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const nombre = String(body.nombre ?? "").trim();
    if (!nombre) return json(400, { error: "Falta el nombre del local" });
    if (!CATEGORIAS_LUGAR.includes(body.categoria))
      return json(400, { error: `categoria debe ser: ${CATEGORIAS_LUGAR.join(", ")}` });
    // Resuelve el dueño (ownerId) de la ficha:
    //  - un "local" crea su propia ficha (dueño = él mismo).
    //  - un admin puede crearla y asignar un dueño por email (ownerEmail).
    let ownerId = "";
    const { Items: lugaresExist } = await ddb.send(new ScanCommand({ TableName: LUGARES }));
    if (isLocal(rol)) {
      if ((lugaresExist ?? []).some((l) => l.ownerId === userId))
        return json(409, { error: "Ya tienes un local registrado" });
      ownerId = userId;
    } else if (canManage(rol) && body.ownerEmail) {
      const dueno = await findUserByEmail(body.ownerEmail);
      if (!dueno) return json(404, { error: "No hay un usuario con ese email. Debe iniciar sesión al menos una vez." });
      if ((lugaresExist ?? []).some((l) => l.ownerId === dueno.userId))
        return json(409, { error: "Ese usuario ya administra otro local" });
      ownerId = dueno.userId;
    }
    const item = {
      ...lugarFields(body),
      id: randomUUID(),
      nombre: nombre.slice(0, 160),
      ownerId,
      // Un local nace pendiente; solo un admin puede aprobar al crear.
      aprobado: canManage(rol) ? Boolean(body.aprobado) : false,
      createdBy: email,
      createdByName: name || email,
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: LUGARES, Item: item }));
    if (ownerId) await setUserLocalId(ownerId, item.id);
    return json(201, { lugar: await withLugarUrls(item) });
  }
  // Asigna (o quita) el dueño de un local por email. Solo admin+.
  if (route === "PUT /lugares/{id}/owner") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id) return json(400, { error: "Falta id" });
    const { Item } = await ddb.send(new GetCommand({ TableName: LUGARES, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    const emailNuevo = String(body?.email ?? "").trim();
    // Desvincula al dueño anterior (si había).
    if (Item.ownerId) await setUserLocalId(Item.ownerId, "");
    if (!emailNuevo) {
      await ddb.send(new UpdateCommand({ TableName: LUGARES, Key: { id }, UpdateExpression: "SET ownerId = :o", ExpressionAttributeValues: { ":o": "" } }));
      return json(200, { ok: true, ownerId: "", ownerNombre: "" });
    }
    const dueno = await findUserByEmail(emailNuevo);
    if (!dueno) return json(404, { error: "No hay un usuario con ese email. Debe iniciar sesión al menos una vez." });
    // Un usuario administra un solo local.
    const { Items } = await ddb.send(new ScanCommand({ TableName: LUGARES }));
    if ((Items ?? []).some((l) => l.id !== id && l.ownerId === dueno.userId))
      return json(409, { error: "Ese usuario ya administra otro local" });
    await ddb.send(new UpdateCommand({ TableName: LUGARES, Key: { id }, UpdateExpression: "SET ownerId = :o", ExpressionAttributeValues: { ":o": dueno.userId } }));
    await setUserLocalId(dueno.userId, id);
    await notify(dueno.userId, `Ahora administras el local "${Item.nombre}". Entra a "Mi local" para completar su ficha.`);
    return json(200, { ok: true, ownerId: dueno.userId, ownerNombre: dueno.alias || dueno.name || dueno.email });
  }
  if (route === "PUT /lugares/{id}") {
    const rol = await getRole(userId);
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    const { Item } = await ddb.send(new GetCommand({ TableName: LUGARES, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    // Puede editar: el dueño del local, o el staff.
    const esDueno = Item.ownerId && Item.ownerId === userId;
    if (!esDueno && !canParticipate(rol)) return json(403, { error: "No puedes editar este local" });
    if (body.categoria != null && !CATEGORIAS_LUGAR.includes(body.categoria))
      return json(400, { error: `categoria debe ser: ${CATEGORIAS_LUGAR.join(", ")}` });
    const updated = {
      ...Item,
      ...lugarFields({ ...Item, ...body }),
      nombre: String(body.nombre ?? Item.nombre).trim().slice(0, 160) || Item.nombre,
      // aprobado solo lo cambia un admin; el dueño/staff no se auto-aprueba.
      aprobado: canManage(rol) && body.aprobado != null ? Boolean(body.aprobado) : Item.aprobado,
      updatedAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: LUGARES, Item: updated }));
    return json(200, { lugar: await withLugarUrls(updated) });
  }
  // Aprobar / desaprobar un local (solo admin+).
  if (route === "PUT /lugares/{id}/aprobar") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id) return json(400, { error: "Falta id" });
    const aprobado = body?.aprobado == null ? true : Boolean(body.aprobado);
    const { Item } = await ddb.send(new GetCommand({ TableName: LUGARES, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    await ddb.send(new UpdateCommand({
      TableName: LUGARES, Key: { id },
      UpdateExpression: "SET aprobado = :a",
      ExpressionAttributeValues: { ":a": aprobado },
    }));
    // Notifica al dueño del local que su ficha fue revisada.
    if (Item.ownerId) await notify(Item.ownerId, aprobado ? `Tu local "${Item.nombre}" fue aprobado.` : `Tu local "${Item.nombre}" quedó pendiente.`);
    return json(200, { ok: true, id, aprobado });
  }
  if (route === "DELETE /lugares/{id}") {
    const rol = await getRole(userId);
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    const pre = await ddb.send(new GetCommand({ TableName: LUGARES, Key: { id } }));
    const esDueno = pre.Item?.ownerId && pre.Item.ownerId === userId;
    if (!esDueno && !canManage(rol)) return json(403, { error: "No puedes borrar este local" });
    const Item = pre.Item;
    // Limpia las fotos en S3 antes de borrar el registro para no dejar huérfanos.
    for (const foto of Item?.fotos ?? []) {
      if (!foto?.key || !FILES_BUCKET) continue;
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: FILES_BUCKET, Key: foto.key }));
      } catch { /* omitir */ }
    }
    await ddb.send(new DeleteCommand({ TableName: LUGARES, Key: { id } }));
    // Desvincula al dueño para que su "Mi local" quede libre.
    if (Item?.ownerId) await setUserLocalId(Item.ownerId, "");
    return json(200, { ok: true });
  }
  if (route === "POST /lugares-upload") {
    const rol = await getRole(userId);
    if (!isLocal(rol) && !canParticipate(rol)) return json(403, { error: "No autorizado" });
    if (!FILES_BUCKET) return json(500, { error: "Almacenamiento no configurado" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const contentType = body.contentType || "image/jpeg";
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(contentType))
      return json(400, { error: "Formato de imagen no permitido" });
    const safe = String(body.filename || "foto").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const key = `lugares/${randomUUID()}-${safe}`;
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: FILES_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 600 }
    );
    return json(200, { uploadUrl, key, contentType });
  }

  // ══════════ REDES SOCIALES (promoción de perfiles) ══════════
  if (route === "GET /redes") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: REDES }));
    const redes = (Items ?? []).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
    return json(200, { redes });
  }
  if (route === "PUT /redes") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!Array.isArray(body?.redes)) return json(400, { error: "Se espera { redes: [] }" });
    // Reemplazo completo: se borra lo anterior y se reescribe la lista ordenada.
    const { Items } = await ddb.send(new ScanCommand({ TableName: REDES }));
    for (const old of Items ?? []) {
      await ddb.send(new DeleteCommand({ TableName: REDES, Key: { id: old.id } }));
    }
    const redes = body.redes.slice(0, 20).map((r, i) => ({
      id: PLATAFORMAS.includes(r.plataforma) ? r.plataforma : `otra-${i}`,
      plataforma: PLATAFORMAS.includes(r.plataforma) ? r.plataforma : "otra",
      handle: String(r.handle ?? "").trim().slice(0, 80),
      url: String(r.url ?? "").trim().slice(0, 300),
      seguidores: Number.isFinite(Number(r.seguidores)) ? Number(r.seguidores) : 0,
      destacada: Boolean(r.destacada),
      orden: i,
    }));
    for (const r of redes) {
      await ddb.send(new PutCommand({ TableName: REDES, Item: r }));
    }
    return json(200, { redes });
  }

  // ══════════ EN VIVOS REALIZADOS (historial) ══════════
  // Complementa GET/PUT /live, que solo describe el en vivo en curso.
  if (route === "GET /lives") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: LIVES }));
    const lives = (Items ?? []).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    return json(200, { lives });
  }
  if (route === "POST /lives") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    if (!body) return json(400, { error: "JSON inválido" });
    const titulo = String(body.titulo ?? "").trim();
    if (!titulo || !body.fecha) return json(400, { error: "Faltan campos: titulo, fecha" });
    const item = {
      id: randomUUID(),
      titulo: titulo.slice(0, 200),
      fecha: String(body.fecha).slice(0, 10),
      plataforma: PLATAFORMAS.includes(body.plataforma) ? body.plataforma : "youtube",
      url: String(body.url ?? "").trim().slice(0, 300),
      duracion: String(body.duracion ?? "").slice(0, 20),
      espectadores: Number.isFinite(Number(body.espectadores)) ? Number(body.espectadores) : 0,
      descripcion: String(body.descripcion ?? "").slice(0, 1000),
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: LIVES, Item: item }));
    return json(201, { live: item });
  }
  if (route === "DELETE /lives/{id}") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: LIVES, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ SECCIONES (temáticas del medio, como las de un periódico) ══════════
  if (route === "GET /secciones") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: SECCIONES }));
    const puedeVerTodo = canManage(await getRole(userId));
    const secciones = (Items ?? [])
      .filter((s) => puedeVerTodo || s.activa)
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99) || String(a.nombre).localeCompare(String(b.nombre)));
    return json(200, { secciones });
  }
  if (route === "POST /secciones") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const body = parseBody(event);
    const nombre = String(body?.nombre ?? "").trim();
    if (!nombre) return json(400, { error: "Falta el nombre de la sección" });
    const item = {
      id: randomUUID(),
      nombre: nombre.slice(0, 80),
      slug: slugify(nombre),
      descripcion: String(body.descripcion ?? "").slice(0, 600),
      color: String(body.color ?? "").slice(0, 20),
      orden: Number.isFinite(Number(body.orden)) ? Number(body.orden) : 99,
      activa: body.activa == null ? true : Boolean(body.activa),
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: SECCIONES, Item: item }));
    return json(201, { seccion: item });
  }
  if (route === "PUT /secciones/{id}") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    const body = parseBody(event);
    if (!id || !body) return json(400, { error: "Datos inválidos" });
    const { Item } = await ddb.send(new GetCommand({ TableName: SECCIONES, Key: { id } }));
    if (!Item) return json(404, { error: "No existe" });
    const nombre = body.nombre != null ? String(body.nombre).trim().slice(0, 80) : Item.nombre;
    const updated = {
      ...Item,
      nombre: nombre || Item.nombre,
      slug: body.nombre != null ? slugify(nombre) : Item.slug,
      descripcion: body.descripcion != null ? String(body.descripcion).slice(0, 600) : Item.descripcion,
      color: body.color != null ? String(body.color).slice(0, 20) : Item.color,
      orden: body.orden != null && Number.isFinite(Number(body.orden)) ? Number(body.orden) : Item.orden,
      activa: body.activa != null ? Boolean(body.activa) : Item.activa,
    };
    await ddb.send(new PutCommand({ TableName: SECCIONES, Item: updated }));
    return json(200, { seccion: updated });
  }
  if (route === "DELETE /secciones/{id}") {
    if (!canManage(await getRole(userId))) return json(403, { error: "Solo administradores" });
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: "Falta id" });
    await ddb.send(new DeleteCommand({ TableName: SECCIONES, Key: { id } }));
    return json(200, { ok: true });
  }

  // ══════════ INFLUENCERS (perfiles públicos del staff) ══════════
  if (route === "GET /influencers") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
    const staff = (Items ?? []).filter((u) => isStaff(u.role));
    const influencers = await Promise.all(
      staff
        .sort((a, b) => rankOf(b.role) - rankOf(a.role))
        .map(async (u) => await withAvatarUrl({
          userId: u.userId,
          alias: u.alias || u.name || "Anónimo/a",
          bio: u.bio ?? "",
          role: u.role,
          secciones: Array.isArray(u.secciones) ? u.secciones : [],
          pais: u.pais ?? "",
          instagram: u.instagram ?? "",
          avatarKey: u.avatarKey,
        }))
    );
    return json(200, { influencers });
  }
  if (route === "GET /influencers/{id}") {
    const id = event.pathParameters?.id;
    const { Item } = await ddb.send(new GetCommand({ TableName: USERS, Key: { userId: id } }));
    if (!Item || !isStaff(Item.role)) return json(404, { error: "No existe" });
    const perfil = await withAvatarUrl({
      userId: Item.userId,
      alias: Item.alias || Item.name || "Anónimo/a",
      bio: Item.bio ?? "",
      role: Item.role,
      secciones: Array.isArray(Item.secciones) ? Item.secciones : [],
      pais: Item.pais ?? "",
      instagram: Item.instagram ?? "",
      avatarKey: Item.avatarKey,
    });
    return json(200, { influencer: perfil });
  }

  // ══════════ USUARIOS / ROLES (solo super admin) ══════════
  if (route === "GET /usuarios") {
    if (!isSuperAdmin(await getRole(userId))) return json(403, { error: "Solo el super admin" });
    const { Items } = await ddb.send(new ScanCommand({ TableName: USERS }));
    const usuarios = (Items ?? [])
      .map((u) => ({
        userId: u.userId, email: u.email, name: u.name, alias: u.alias ?? "",
        role: u.role ?? "miembro", secciones: Array.isArray(u.secciones) ? u.secciones : [],
      }))
      .sort((a, b) => rankOf(b.role) - rankOf(a.role) || String(a.email).localeCompare(String(b.email)));
    return json(200, { usuarios });
  }
  if (route === "PUT /usuarios/{id}/role") {
    const miRol = await getRole(userId);
    if (!isSuperAdmin(miRol)) return json(403, { error: "Solo el super admin gestiona roles" });
    const body = parseBody(event);
    const targetId = event.pathParameters?.id;
    if (!body || !targetId || !ROLES.includes(body.role)) return json(400, { error: `role debe ser: ${ROLES.join(", ")}` });
    // super_admin es único: se fija por ADMIN_EMAIL en el bootstrap y no se asigna por API.
    if (body.role === "super_admin") return json(403, { error: "El rol super_admin no se puede asignar" });
    // No se puede tocar a un super_admin (ni degradarlo).
    const objetivo = await getRole(targetId);
    if (objetivo === "super_admin") return json(403, { error: "No se puede cambiar el rol del super admin" });
    // Solo se otorgan roles de rango estrictamente menor al propio (evita escalada).
    if (rankOf(body.role) >= rankOf(miRol)) return json(403, { error: "No puedes asignar un rol igual o superior al tuyo" });
    await ddb.send(new UpdateCommand({
      TableName: USERS,
      Key: { userId: targetId },
      UpdateExpression: "SET #r = :r",
      ExpressionAttributeNames: { "#r": "role" },
      ExpressionAttributeValues: { ":r": body.role },
    }));
    return json(200, { ok: true, userId: targetId, role: body.role });
  }
  // Asigna a un influencer las secciones en las que puede publicar.
  if (route === "PUT /usuarios/{id}/secciones") {
    if (!isSuperAdmin(await getRole(userId))) return json(403, { error: "Solo el super admin" });
    const body = parseBody(event);
    const targetId = event.pathParameters?.id;
    if (!body || !targetId || !Array.isArray(body.secciones)) return json(400, { error: "Se espera { secciones: [] }" });
    // Valida contra las secciones existentes.
    const { Items } = await ddb.send(new ScanCommand({ TableName: SECCIONES }));
    const validas = new Set((Items ?? []).map((s) => s.id));
    const secciones = [...new Set(body.secciones.map(String))].filter((s) => validas.has(s)).slice(0, 50);
    await ddb.send(new UpdateCommand({
      TableName: USERS,
      Key: { userId: targetId },
      UpdateExpression: "SET secciones = :s",
      ExpressionAttributeValues: { ":s": secciones },
    }));
    return json(200, { ok: true, userId: targetId, secciones });
  }

  return json(404, { error: "Ruta no encontrada" });
};
