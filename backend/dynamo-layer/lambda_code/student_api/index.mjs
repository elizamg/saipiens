import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  BatchGetCommand,
} from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const T = {
  STUDENTS: process.env.STUDENTS_TABLE,
  INSTRUCTORS: process.env.INSTRUCTORS_TABLE,
  COURSES: process.env.COURSES_TABLE,
  ENROLLMENTS: process.env.ENROLLMENTS_TABLE,
  UNITS: process.env.UNITS_TABLE,
  OBJECTIVES: process.env.OBJECTIVES_TABLE,
  QUESTIONS: process.env.QUESTIONS_TABLE,
};

const IDX = {
  COURSE_UNITS: process.env.COURSE_UNITS_INDEX,
  UNIT_OBJECTIVES: process.env.UNIT_OBJECTIVES_INDEX,
  OBJECTIVE_QUESTIONS: process.env.OBJECTIVE_QUESTIONS_INDEX,
};

export const handler = async (event) => {
  try {
    const method = event.requestContext?.http?.method || "UNKNOWN";
    let path = event.requestContext?.http?.path || "";

    // Strip stage prefix like /prod
    path = path.replace(/^\/[^/]+/, "");

    // ---------- helpers ----------
    const claims = event.requestContext?.authorizer?.jwt?.claims;
    const authedStudentId = claims?.sub || null;

    // ---------- HEALTH ----------
    if (method === "GET" && path === "/health") {
      return json(200, { ok: true });
    }

    // ---------- CURRENT STUDENT (auth) ----------
    // GET /current-student
    if (method === "GET" && path === "/current-student") {
      if (!authedStudentId) return json(401, { error: "Unauthorized" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: T.STUDENTS,
          Key: { id: authedStudentId },
        })
      );

      // Option: auto-provision a shell student if missing
      const student =
        resp.Item ??
        {
          id: authedStudentId,
          name: "",
          yearLabel: "",
          avatarUrl: null,
        };

      return json(200, student);
    }

    // ---------- COURSES ----------
    // GET /students/{studentId}/courses  (auth; ignore param, use token)
    if (method === "GET" && path.match(/^\/students\/[^/]+\/courses$/)) {
      if (!authedStudentId) return json(401, { error: "Unauthorized" });

      // 1) query enrollments by studentId
      const enr = await ddb.send(
        new QueryCommand({
          TableName: T.ENROLLMENTS,
          KeyConditionExpression: "studentId = :sid",
          ExpressionAttributeValues: { ":sid": authedStudentId },
        })
      );

      const courseIds = (enr.Items ?? []).map((x) => x.courseId).filter(Boolean);
      if (courseIds.length === 0) return json(200, []);

      // 2) batch-get courses
      const keys = courseIds.map((id) => ({ id }));
      const b = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [T.COURSES]: { Keys: keys },
          },
        })
      );

      const courses = (b.Responses?.[T.COURSES] ?? []);
      return json(200, courses);
    }

    // GET /courses/{courseId}
    if (method === "GET" && path.startsWith("/courses/") && !path.includes("/units")) {
      const courseId = event.pathParameters?.courseId;
      if (!courseId) return json(400, { error: "Missing courseId" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: T.COURSES,
          Key: { id: courseId },
        })
      );

      return json(200, resp.Item ?? null);
    }

    // ---------- INSTRUCTORS ----------
    // POST /instructors/batch  body: { ids: string[] }
    if (method === "POST" && path === "/instructors/batch") {
      const body = safeJson(event.body);
      const ids = Array.isArray(body?.ids) ? body.ids : [];

      if (ids.length === 0) return json(200, []);

      const keys = ids.map((id) => ({ id }));
      const b = await ddb.send(
        new BatchGetCommand({
          RequestItems: {
            [T.INSTRUCTORS]: { Keys: keys },
          },
        })
      );

      const instructors = b.Responses?.[T.INSTRUCTORS] ?? [];
      return json(200, instructors);
    }

    // ---------- UNITS ----------
    // GET /courses/{courseId}/units  (GSI CourseUnitsIndex)
    if (method === "GET" && path.match(/^\/courses\/[^/]+\/units$/)) {
      const courseId = event.pathParameters?.courseId;
      if (!courseId) return json(400, { error: "Missing courseId" });

      const resp = await ddb.send(
        new QueryCommand({
          TableName: T.UNITS,
          IndexName: IDX.COURSE_UNITS,
          KeyConditionExpression: "courseId = :cid",
          ExpressionAttributeValues: { ":cid": courseId },
        })
      );

      return json(200, resp.Items ?? []);
    }

    // GET /units/{unitId}
    if (method === "GET" && path.startsWith("/units/") && !path.includes("/objectives")) {
      const unitId = event.pathParameters?.unitId;
      if (!unitId) return json(400, { error: "Missing unitId" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: T.UNITS,
          Key: { id: unitId },
        })
      );

      return json(200, resp.Item ?? null);
    }

    // ---------- OBJECTIVES ----------
    // GET /units/{unitId}/objectives  (GSI UnitObjectivesIndex)
    if (method === "GET" && path.match(/^\/units\/[^/]+\/objectives$/)) {
      const unitId = event.pathParameters?.unitId;
      if (!unitId) return json(400, { error: "Missing unitId" });

      const resp = await ddb.send(
        new QueryCommand({
          TableName: T.OBJECTIVES,
          IndexName: IDX.UNIT_OBJECTIVES,
          KeyConditionExpression: "unitId = :uid",
          ExpressionAttributeValues: { ":uid": unitId },
        })
      );

      return json(200, resp.Items ?? []);
    }

    // GET /objectives/{objectiveId}
    if (method === "GET" && path.startsWith("/objectives/") && !path.includes("/questions")) {
      const objectiveId = event.pathParameters?.objectiveId;
      if (!objectiveId) return json(400, { error: "Missing objectiveId" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: T.OBJECTIVES,
          Key: { id: objectiveId },
        })
      );

      return json(200, resp.Item ?? null);
    }

    // ---------- QUESTIONS ----------
    // GET /objectives/{objectiveId}/questions (GSI ObjectiveQuestionsIndex, sorted by difficultyStars asc)
    if (method === "GET" && path.match(/^\/objectives\/[^/]+\/questions$/)) {
      const objectiveId = event.pathParameters?.objectiveId;
      if (!objectiveId) return json(400, { error: "Missing objectiveId" });

      const resp = await ddb.send(
        new QueryCommand({
          TableName: T.QUESTIONS,
          IndexName: IDX.OBJECTIVE_QUESTIONS,
          KeyConditionExpression: "objectiveId = :oid",
          ExpressionAttributeValues: { ":oid": objectiveId },
          // automatically sorted by difficultyStars because it's the index sort key
          ScanIndexForward: true,
        })
      );

      return json(200, resp.Items ?? []);
    }

    // GET /questions/{questionId}
    if (method === "GET" && path.startsWith("/questions/")) {
      const questionId = event.pathParameters?.questionId;
      if (!questionId) return json(400, { error: "Missing questionId" });

      const resp = await ddb.send(
        new GetCommand({
          TableName: T.QUESTIONS,
          Key: { id: questionId },
        })
      );

      return json(200, resp.Item ?? null);
    }

    return json(404, { error: "Route not found", method, path });
  } catch (err) {
    console.error("ERROR:", err);
    return json(500, { error: "Server error", details: String(err?.message ?? err) });
  }
};

function safeJson(body) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

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
