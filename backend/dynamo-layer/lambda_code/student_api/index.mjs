import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const STUDENTS_TABLE = process.env.TABLE_NAME; // your Students table name
const QUESTIONS_TABLE = "Questions";          // fixed name

export const handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || "UNKNOWN";
    let path = event.requestContext?.http?.path || "";

    // Strip stage prefix like /prod
    path = path.replace(/^\/[^/]+/, "");

    // ---------- Public ----------
    if (method === "GET" && path === "/health") {
      return json(200, { ok: true });
    }

    // GET /questions/{questionID}  (public)
    if (method === "GET" && path.startsWith("/questions/")) {
      const questionID = event.pathParameters?.questionID; // ✅ correct param name

      if (!questionID) return json(400, { error: "Missing questionID" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: QUESTIONS_TABLE,
          Key: { questionID }, // ✅ matches Questions table PK
        })
      );

      return json(200, { questionID, item: resp.Item ?? null });
    }

    // POST /questions  (public for now)
    if (method === "POST" && path === "/questions") {
      const body = event.body ? JSON.parse(event.body) : {};
      const questionID = body.questionID;

      if (!questionID) {
        return json(400, { error: "Missing required field: questionID" });
      }

      const item = {
        questionID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await ddb.send(
        new PutCommand({
          TableName: QUESTIONS_TABLE,
          Item: item,
          ConditionExpression: "attribute_not_exists(questionID)", // no overwrite
        })
      );

      return json(201, { saved: true, item });
    }

    // ---------- Auth-required ----------
    const claims = event.requestContext?.authorizer?.jwt?.claims;

    // GET /me
    if (method === "GET" && path === "/me") {
      if (!claims?.sub) return json(401, { error: "Unauthorized (missing Cognito token)" });
      return json(200, { sub: claims.sub, email: claims.email });
    }

    // Student endpoints
    if (method === "GET" && path === "/student") {
      if (!claims?.sub) return json(401, { error: "Unauthorized (missing Cognito token)" });
      const studentId = claims.sub;

      const resp = await ddb.send(
        new GetCommand({
          TableName: STUDENTS_TABLE,
          Key: { studentID: studentId }, // ✅ Students table PK is studentID
        })
      );

      return json(200, { studentID: studentId, item: resp.Item ?? null });
    }

    if (method === "POST" && path === "/student") {
      if (!claims?.sub) return json(401, { error: "Unauthorized (missing Cognito token)" });
      const studentId = claims.sub;

      const body = event.body ? JSON.parse(event.body) : {};
      const item = {
        studentID: studentId,          // ✅ Students table PK
        ...body,
        updatedAt: new Date().toISOString(),
      };

      await ddb.send(
        new PutCommand({
          TableName: STUDENTS_TABLE,
          Item: item,
        })
      );

      return json(200, { saved: true, item });
    }

    return json(404, { error: "Route not found", method, path });
  } catch (err) {
    console.error("ERROR:", err);
    return json(500, { error: "Server error", details: String(err?.message ?? err) });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(obj),
  };
}
