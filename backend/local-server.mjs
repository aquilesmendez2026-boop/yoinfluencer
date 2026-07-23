// ─────────────────────────────────────────────────────────────
// Servidor de DESARROLLO. No se despliega: reemplaza a API Gateway
// para poder correr el handler real (src/index.mjs) desde el notebook,
// contra las tablas y buckets reales de DynamoDB y S3.
//
//   node local-server.mjs        (o: npm run dev)
//
// Diferencia importante con producción: API Gateway valida la firma del
// ID token de Firebase. Acá el token solo se DECODIFICA, no se verifica.
// Sirve para desarrollo local; nunca expongas este servidor a internet.
// ─────────────────────────────────────────────────────────────
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8787);
const REGION = process.env.AWS_REGION ?? "us-east-2";
const ACCOUNT = process.env.AWS_ACCOUNT ?? "970335222766";

// Mismas variables que inyecta template.yaml en la Lambda.
Object.assign(process.env, {
  AWS_REGION: REGION,
  TABLE_USERS: "yoinfluencer-usuarios",
  TABLE_EVENTS: "yoinfluencer-eventos",
  TABLE_REUNIONES: "yoinfluencer-reuniones",
  TABLE_NOTAS: "yoinfluencer-notas",
  TABLE_EPISODIOS: "yoinfluencer-episodios",
  TABLE_DESCARGAS: "yoinfluencer-descargas",
  TABLE_PREGUNTAS: "yoinfluencer-preguntas",
  TABLE_CONFIG: "yoinfluencer-config",
  TABLE_PRODUCCION: "yoinfluencer-produccion",
  TABLE_NOTIFICACIONES: "yoinfluencer-notificaciones",
  TABLE_LUGARES: "yoinfluencer-lugares",
  TABLE_REDES: "yoinfluencer-redes",
  TABLE_LIVES: "yoinfluencer-lives",
  TABLE_SECCIONES: "yoinfluencer-secciones",
  AVATARS_BUCKET: `yoinfluencer-avatars-${ACCOUNT}`,
  FILES_BUCKET: `yoinfluencer-archivos-${ACCOUNT}`,
  // Super admin del proyecto: recibe el rol al primer login (bootstrap en GET /me).
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "aquiles@umine.com",
});

const { handler } = await import("./src/index.mjs");

// Rutas con parámetro de path, para reconstruir el routeKey que espera el handler.
// Las rutas "-upload" NO llevan slash, así que no colisionan con /{id}.
const CON_PARAM = [
  "/eventos", "/episodios", "/descargas", "/preguntas", "/produccion",
  "/lugares", "/lives", "/notas", "/reuniones", "/secciones", "/influencers",
];

/** Convierte la URL real en el routeKey de API Gateway y extrae pathParameters. */
function resolverRuta(method, pathname) {
  let m;
  if ((m = pathname.match(/^\/usuarios\/([^/]+)\/(role|secciones)$/))) {
    return { routeKey: `${method} /usuarios/{id}/${m[2]}`, params: { id: m[1] } };
  }
  if ((m = pathname.match(/^\/lugares\/([^/]+)\/(aprobar|owner)$/))) {
    return { routeKey: `${method} /lugares/{id}/${m[2]}`, params: { id: m[1] } };
  }
  for (const base of CON_PARAM) {
    if ((m = pathname.match(new RegExp(`^${base}/([^/]+)$`)))) {
      return { routeKey: `${method} ${base}/{id}`, params: { id: decodeURIComponent(m[1]) } };
    }
  }
  return { routeKey: `${method} ${pathname}`, params: undefined };
}

/** Decodifica el payload del JWT sin verificar la firma (solo desarrollo). */
function claimsDelToken(authHeader) {
  const token = (authHeader ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization,content-type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  };
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const { routeKey, params } = resolverRuta(req.method, url.pathname);

  const claims = claimsDelToken(req.headers.authorization);
  if (!claims) {
    res.writeHead(401, { ...cors, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Falta el bearer token de Firebase" }));
  }

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");

  const event = {
    routeKey,
    rawPath: url.pathname,
    pathParameters: params,
    queryStringParameters: Object.fromEntries(url.searchParams),
    body: body || undefined,
    requestContext: { authorizer: { jwt: { claims } } },
  };

  try {
    const out = await handler(event);
    console.log(`${out.statusCode}  ${routeKey}`);
    res.writeHead(out.statusCode, { ...cors, ...(out.headers ?? {}) });
    res.end(out.body ?? "");
  } catch (e) {
    console.error(`500  ${routeKey}\n`, e);
    res.writeHead(500, { ...cors, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: e.message }));
  }
}).listen(PORT, () => {
  console.log(`API local en http://localhost:${PORT}`);
  console.log(`Tablas y buckets: reales, region ${REGION}, cuenta ${ACCOUNT}`);
  console.log(`ADMIN_EMAIL=${process.env.ADMIN_EMAIL || "(sin definir)"}`);
});
