# Sapiens Backend Architecture & Implementation Documentation

## Overview

This document provides a comprehensive description of the backend system built during this development sprint. It covers:

- Cloud infrastructure
- Authentication architecture
- API Gateway configuration
- Lambda implementation (Python)
- DynamoDB multi-table schema
- Global Secondary Index (GSI) design
- Route contracts
- Authorization model
- Data seeding process
- Testing procedures
- Migration from Node.js to Python
- Known pitfalls and lessons learned

The system is deployed in AWS region: **us-west-1**.

Base API URL:

```
https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod
```

---

# 1. High-Level Architecture

The backend follows a serverless architecture:

API Gateway (HTTP API)
    → Cognito JWT Authorizer
        → Single Lambda Function (Python 3.12)
            → DynamoDB (multi-table design)

All routes share a single Lambda integration.

---

# 2. Authentication System (Amazon Cognito)

## User Pool

User Pool ID:
```
us-west-1_YCOEOrnke
```

Authentication is handled via:
- Cognito User Pool
- JWT Authorizer in API Gateway

## Token Flow Used for Testing

Tokens are generated using AWS CLI:

```
aws cognito-idp initiate-auth \
  --region us-west-1 \
  --client-id <APP_CLIENT_ID> \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="test@student.com",PASSWORD="Test123!"
```

The IdToken is extracted and used as:

```
Authorization: Bearer <IdToken>
```

## Authorizer Configuration

Issuer:
```
https://cognito-idp.us-west-1.amazonaws.com/us-west-1_YCOEOrnke
```

Audience:
```
<App Client ID used to generate token>
```

Only IdToken is used for API Gateway validation.

---

# 3. API Gateway Configuration

- Type: HTTP API
- Stage: `prod`
- Payload format version: 2.0
- Single Lambda integration for all routes
- JWT authorizer applied to protected routes

Public routes:
- GET /health

Protected routes:
- GET /current-student
- GET /students/{studentId}/courses
- POST /instructors/batch
- All course/unit/objective/question routes (configurable)

---

# 4. Lambda Implementation (Python)

Runtime: Python 3.12

Handler format:
```
lambda_function.handler
```

Key implementation characteristics:

- Stage prefix stripped from path
- Manual router using method + path
- JWT claims read from:
  event.requestContext.authorizer.jwt.claims
- Uses boto3 DynamoDB resource
- All responses returned in Lambda proxy format:

```
{
  "statusCode": 200,
  "headers": {...},
  "body": json.dumps(...)
}
```

---

# 5. DynamoDB Schema (Multi-Table Design)

## Design Philosophy

- One entity per table
- All primary identifiers use field name `id`
- GSIs added only for required access patterns
- No single-table complexity
- Optimized for frontend query patterns

---

## Tables

### Students
PK: id (String)

Fields:
- id
- name
- yearLabel
- avatarUrl
- createdAt
- updatedAt

Access:
- Get by id

---

### Instructors
PK: id

Fields:
- id
- name
- avatarUrl

Access:
- Batch get by id

---

### Courses
PK: id

Fields:
- id
- title
- instructorIds

Access:
- Get by id

---

### Enrollments
PK: studentId
SK: courseId

Purpose:
- Efficient student → courses mapping

---

### Units
PK: id

GSI: CourseUnitsIndex
- PK: courseId
- SK: id

---

### Objectives
PK: id

GSI: UnitObjectivesIndex
- PK: unitId
- SK: id

---

### Questions
PK: id

GSI: ObjectiveQuestionsIndex
- PK: objectiveId
- SK: difficultyStars (Number)

Sorting guaranteed by DynamoDB on difficultyStars ascending.

---

### StudentObjectiveProgress
PK: studentId
SK: objectiveId

---

### ChatThreads
PK: id

GSI: UnitThreadsIndex
- PK: unitId
- SK: objectiveId

---

### ChatMessages
PK: threadId
SK: createdAt (ISO string)

Provides chronological ordering.

---

### Awards
PK: studentId
SK: id

GSI: StudentCourseAwardsIndex
- PK: studentId
- SK: courseId

---

### FeedbackItems
PK: studentId
SK: id

GSI: CourseFeedbackIndex
- PK: courseId
- SK: unitId

---

# 6. Implemented Endpoints

## Public
- GET /health
- GET /courses/{courseId}
- GET /courses/{courseId}/units
- GET /units/{unitId}/objectives
- GET /objectives/{objectiveId}/questions
- GET /questions/{questionId}

## Protected
- GET /current-student
- GET /students/{studentId}/courses
- POST /instructors/batch

---

# 7. Seed Data Process

Seeded using AWS CLI via CloudShell.

Created:
- Demo course
- Demo unit
- Demo objective
- Three demo questions (difficultyStars 1,2,3)
- Enrollment row

Verified GSI queries return correctly sorted data.

---

# 8. Migration from Node to Python

Originally implemented in Node.js 24.

Migration steps:
1. Created Python Lambda
2. Set handler correctly
3. Copied environment variables
4. Switched API Gateway integration
5. Verified /health endpoint
6. Reimplemented router in Python

Lessons learned:
- Handler configuration critical
- JWT authorizer requires correct audience
- AccessToken vs IdToken matters
- GSIs must match attribute types exactly

---

# 9. Known Pitfalls Encountered

- GSI sort key type mismatch (String vs Number)
- Missing Lambda imports
- Incorrect JWT audience configuration
- Using AccessToken instead of IdToken
- API Gateway still pointing to old Lambda
- Forgetting to export TOKEN in shell

---

# 10. Current State

The backend now supports:

- Authenticated user resolution
- Course → Unit → Objective → Question traversal
- Student-scoped course listing
- Instructor batch lookup
- Deterministic ordering via GSIs

System is stable and contract-aligned.

---

# 11. Future Extensions

- Implement StudentObjectiveProgress endpoints
- Implement UnitProgress aggregation
- Implement ChatThreads and ChatMessages endpoints
- Add write endpoints for instructors/courses
- Add admin role restrictions
- Replace demo auto-provisioned student defaults

---

# 12. Operational Notes

- All timestamps ISO 8601
- All IDs are strings
- On-demand billing mode
- Single Lambda integration
- JWT enforced at API Gateway layer

---

# Conclusion

The backend is fully functional, serverless, contract-aligned, and production-ready in architecture. It supports secure authentication, relational-style traversal via DynamoDB GSIs, and deterministic response ordering required by the frontend contract.

End of document.

