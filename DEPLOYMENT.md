# Deployment & Infrastructure Guide

This document describes the cloud infrastructure, deployment procedures, and environment configuration for Sapiens.

## Architecture Overview

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Vercel      │────▶│  API Gateway      │────▶│  Lambda      │
│   (Frontend)  │     │  HTTP API v2      │     │  Python 3.12 │
└──────────────┘     └──────────────────┘     └──────┬──────┘
                              │                       │
                     ┌────────┴────────┐      ┌──────┴──────┐
                     │  Cognito         │      │  DynamoDB    │
                     │  User Pool       │      │  (15 tables) │
                     └─────────────────┘      └──────┬──────┘
                                                      │
                                              ┌──────┴──────┐
                                              │  S3 Bucket   │
                                              │  (staging)   │
                                              └─────────────┘
                                                      │
                                              ┌──────┴──────┐
                                              │  Gemini API  │
                                              │  (Google AI) │
                                              └─────────────┘
```

## AWS Services

| Service        | Resource Name / ID                              | Region     |
|----------------|-------------------------------------------------|------------|
| API Gateway    | HTTP API v2                                     | us-west-1  |
| Lambda         | `sapiens-api`                                   | us-west-1  |
| DynamoDB       | 15 tables (see `backend/table_schema.md`)       | us-west-1  |
| Cognito        | User Pool `us-west-1_pzs7P5vGg`                | us-west-1  |
| S3             | `sapiens-upload-staging-681816819209`            | us-west-1  |

**Base API URL:** `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod`

## Frontend Deployment (Vercel)

The frontend is deployed to Vercel at [https://sapiens-pp4l.vercel.app/](https://sapiens-pp4l.vercel.app/).

### Environment Variables (Vercel Dashboard)

| Variable                     | Value                                              |
|------------------------------|----------------------------------------------------|
| `VITE_API_BASE_URL`         | `https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod` |
| `VITE_COGNITO_USER_POOL_ID` | `us-west-1_pzs7P5vGg`                             |
| `VITE_COGNITO_CLIENT_ID`    | `34es28m8ocaom5rt55khms7p07`                       |

### Deploy Process

Vercel auto-deploys on push to `main`. To deploy manually:

```bash
cd frontend
npm run build          # outputs to dist/
# Vercel CLI or dashboard deploy from dist/
```

## Backend Deployment (Lambda)

The backend is a single Lambda function ("lambdalith") — all routes are handled by one handler.

### Lambda Configuration

| Setting       | Value                  |
|---------------|------------------------|
| Runtime       | Python 3.12            |
| Handler       | `lambda_handler.handler` |
| Memory        | 512 MB                 |
| Timeout       | 300 seconds (5 min)    |
| Architecture  | x86_64                 |

### Lambda Environment Variables

**Required:**

| Variable                     | Description                              |
|------------------------------|------------------------------------------|
| `SAIPIENS_GEMINI_API_KEY`   | Google Gemini API key for AI pipelines   |
| `STUDENTS_TABLE`            | DynamoDB table name for Students         |
| `INSTRUCTORS_TABLE`         | DynamoDB table name for Instructors      |
| `COURSES_TABLE`             | DynamoDB table name for Courses          |
| `ENROLLMENTS_TABLE`         | DynamoDB table name for Enrollments      |
| `UNITS_TABLE`               | DynamoDB table name for Units            |
| `OBJECTIVES_TABLE`          | DynamoDB table name for Objectives       |
| `QUESTIONS_TABLE`           | DynamoDB table name for Questions        |
| `ITEM_STAGES_TABLE`         | DynamoDB table name for ItemStages       |
| `STUDENT_OBJECTIVE_PROGRESS_TABLE` | DynamoDB table name for progress  |
| `CHAT_THREADS_TABLE`        | DynamoDB table name for ChatThreads      |
| `CHAT_MESSAGES_TABLE`       | DynamoDB table name for ChatMessages     |
| `AWARDS_TABLE`              | DynamoDB table name for Awards           |
| `FEEDBACK_ITEMS_TABLE`      | DynamoDB table name for FeedbackItems    |
| `KNOWLEDGE_TOPICS_TABLE`    | DynamoDB table name for KnowledgeTopics  |
| `KNOWLEDGE_QUEUE_ITEMS_TABLE` | DynamoDB table name for KnowledgeQueueItems |

**GSI Names:**

| Variable                     | Description                              |
|------------------------------|------------------------------------------|
| `UNIT_OBJECTIVES_INDEX`     | GSI on Objectives table (unitId)         |
| `OBJECTIVE_QUESTIONS_INDEX` | GSI on Questions table (objectiveId)     |
| `COURSE_UNITS_INDEX`        | GSI on Units table (courseId)            |
| `INSTRUCTOR_COURSES_INDEX`  | GSI on Courses table (instructorId)      |
| `COURSE_ENROLLMENTS_INDEX`  | GSI on Enrollments table (courseId)       |
| `ITEM_STAGES_BY_ITEM_ID`   | GSI on ItemStages table (itemId)         |
| `UNIT_THREADS_INDEX`        | GSI on ChatThreads table (unitId)        |
| `UNIT_KNOWLEDGE_TOPICS_INDEX` | GSI on KnowledgeTopics (unitId + order)|
| `UNIT_QUEUE_INDEX`          | GSI on KnowledgeQueueItems (unitId + order) |

**Auth Configuration:**

| Variable              | Description                                      |
|-----------------------|--------------------------------------------------|
| `DEV_AUTH_ENABLED`    | `"true"` or `"false"` — enables dev header auth  |
| `DEV_AUTH_TOKEN`      | Shared secret for dev auth (e.g., `dev-secret`)   |
| `CORS_ALLOW_ORIGIN`  | CORS origin header value (currently `*`)          |

### Deploying Lambda Code

The Lambda code lives in `backend/lambdalith/`. All dependencies are vendored (no `pip install` needed at deploy time).

1. Zip the `lambdalith/` directory contents (not the directory itself):
   ```bash
   cd backend/lambdalith
   zip -r ../../sapiens-api.zip . -x "__pycache__/*" "*.pyc"
   ```

2. Upload to Lambda:
   ```bash
   aws lambda update-function-code \
     --function-name sapiens-api \
     --zip-file fileb://../../sapiens-api.zip \
     --region us-west-1
   ```

3. Verify:
   ```bash
   curl https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod/health
   # Expected: {"ok": true}
   ```

## Cognito Setup

### User Pool

- **Pool ID:** `us-west-1_pzs7P5vGg`
- **App Client:** `sapiens-public` (`34es28m8ocaom5rt55khms7p07`) — no client secret
- **Required attributes:** `email`, `given_name`, `family_name`
- **Password policy:** Standard Cognito defaults

### Groups

| Group         | Purpose                                    |
|---------------|--------------------------------------------|
| `instructors` | Members can access instructor API routes   |

All self-registrations default to student. To promote a user to instructor:

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-west-1_pzs7P5vGg \
  --username <email> \
  --group-name instructors \
  --region us-west-1
```

### JWT Flow

1. Frontend authenticates via Cognito SDK → receives IdToken
2. IdToken attached as `Authorization: Bearer <token>` on every API request
3. API Gateway JWT Authorizer validates the token (all routes except `/health`)
4. Lambda reads `sub`, `given_name`, `family_name`, and `cognito:groups` claims

## DynamoDB Tables

All 15 tables use on-demand billing (PAY_PER_REQUEST). See `backend/table_schema.md` for full schema definitions including partition keys, sort keys, and GSIs.

## S3 Staging Bucket

- **Bucket:** `sapiens-upload-staging-681816819209`
- **Purpose:** Temporary storage for uploaded curriculum documents (PDFs)
- **Lifecycle:** Objects auto-expire after 1 day
- **Access:** Lambda generates presigned PUT URLs for direct browser uploads

## Production Hardening Checklist

Before production launch:

- [ ] Set `DEV_AUTH_ENABLED=false` in Lambda environment
- [ ] Restrict `CORS_ALLOW_ORIGIN` to `https://sapiens-pp4l.vercel.app`
- [ ] Add structured logging (CloudWatch)
- [ ] Add enrollment-based authorization checks (ensure students can only access their enrolled courses)
- [ ] Review Lambda memory/timeout for production workloads
- [ ] Set up CloudWatch alarms for Lambda errors and API Gateway 5xx rates
