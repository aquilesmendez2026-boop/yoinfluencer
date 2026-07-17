import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const USERS = process.env.TABLE_USERS;
const EVENTS = process.env.TABLE_EVENTS;

const TYPES = ["stream", "charla", "especial"];

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const claimsOf = (event) => event?.requestContext?.authorizer?.jwt?.claims ?? {};

async function getRole(userId) {
  const { Item } = await ddb.send(
    new GetCommand({ TableName: USERS, Key: { userId } })
  );
  return Item?.role ?? "miembro";
}

/**
 * El JWT Authorizer ya validó el Firebase ID token (firma, expiración,
 * issuer y audience). Aquí solo enrutamos con los claims verificados.
 */
export const handler = async (event) => {
  const route = event.routeKey; // p.ej. "GET /me", "POST /eventos"
  const claims = claimsOf(event);
  const userId = claims.sub || claims.user_id;
  const email = claims.email || "";
  const name = claims.name || "";

  if (!userId) return json(401, { error: "Token sin identidad de usuario" });

  // ── GET /me : registra al usuario y devuelve sus datos + rol ──
  if (route === "GET /me") {
    const now = new Date().toISOString();
    await ddb.send(
      new UpdateCommand({
        TableName: USERS,
        Key: { userId },
        UpdateExpression:
          "SET email = :e, #n = :n, lastLogin = :t, createdAt = if_not_exists(createdAt, :t), #r = if_not_exists(#r, :role)",
        ExpressionAttributeNames: { "#n": "name", "#r": "role" },
        ExpressionAttributeValues: {
          ":e": email,
          ":n": name,
          ":t": now,
          ":role": "miembro",
        },
      })
    );
    const { Item } = await ddb.send(
      new GetCommand({ TableName: USERS, Key: { userId } })
    );
    return json(200, { user: Item });
  }

  // ── GET /eventos : lista de eventos (cualquier usuario con sesión) ──
  if (route === "GET /eventos") {
    const { Items } = await ddb.send(new ScanCommand({ TableName: EVENTS }));
    const eventos = (Items ?? []).sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    );
    return json(200, { eventos });
  }

  // ── POST /eventos : crear evento (solo admin) ──
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

  // ── DELETE /eventos/{id} : eliminar evento (solo admin) ──
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
