import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_USERS;

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

/**
 * El JWT Authorizer de API Gateway ya validó el Firebase ID token (firma,
 * expiración, issuer y audience). Aquí solo leemos los claims verificados.
 */
export const handler = async (event) => {
  const claims = event?.requestContext?.authorizer?.jwt?.claims ?? {};
  const userId = claims.sub || claims.user_id;
  const email = claims.email || "";
  const name = claims.name || "";

  if (!userId) {
    return json(401, { error: "Token sin identidad de usuario" });
  }

  const now = new Date().toISOString();

  // Upsert del usuario. Conserva el rol si ya existe; por defecto "miembro".
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
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
    new GetCommand({ TableName: TABLE, Key: { userId } })
  );

  return json(200, { user: Item });
};
