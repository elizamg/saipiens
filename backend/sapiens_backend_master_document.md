# Sapiens Backend -- Architecture & Implementation Master Document

**Region:** us-west-1\
**Base API URL:**\
https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod

This document consolidates all backend architecture, implementation
details, authentication flow, operational considerations, testing
procedures, migration history, and production readiness guidance into a
single reference document.

> Note: Detailed table schema and full route schema are documented
> separately and intentionally excluded from this document.

------------------------------------------------------------------------

# 1. System Overview

The Sapiens backend is a fully serverless architecture built on AWS.

## High-Level Topology

→ API Gateway (HTTP API v2)\
→ Lambda (`sapiens-api`, Python 3.14)\
→ DynamoDB (multi-table design)

All routes share a single Lambda integration.

------------------------------------------------------------------------

# 2. Infrastructure

## Cloud Stack

-   API Gateway: HTTP API (v2)
-   Lambda Runtime: Python 3.12
-   Database: DynamoDB (multi-table, access-pattern driven)
-   Authentication: Cognito User Pool + JWT Authorizer
-   Billing Mode: On-demand (PAY_PER_REQUEST)

------------------------------------------------------------------------

# 3. Authentication Model

## Production Authentication

-   Cognito User Pool
-   JWT Authorizer configured in API Gateway
-   Student identity resolved from JWT `sub` claim
-   Authorization header format:

```{=html}
<!-- -->
```
    Authorization: Bearer <IdToken>

### Cognito Details

User Pool ID:

    us-west-1_YCOEOrnke

Issuer:

    https://cognito-idp.us-west-1.amazonaws.com/us-west-1_YCOEOrnke

Only IdToken is used for API Gateway validation.

------------------------------------------------------------------------

## Development Authentication Mode

When:

    DEV_AUTH_ENABLED=true

Headers used:

    X-Dev-Student-Id
    X-Dev-Token

This enables full browser-based testing without AWS credentials.

⚠ Dev authentication must be disabled before production deployment.

------------------------------------------------------------------------

# 4. Lambda Architecture

## Core Characteristics

-   Single Lambda handler with manual router
-   Stage prefix stripped from path (`/prod/...` → `/...`)
-   Method + normalized path dispatch
-   Decimal-safe JSON serialization
-   Strict 404 handling for missing entities
-   Consistent CORS headers
-   Pagination-safe DynamoDB queries
-   BatchGet retry handling

## Lambda Proxy Response Format

    {
      "statusCode": 200,
      "headers": {...},
      "body": JSON.stringify(...)
    }

------------------------------------------------------------------------

# 5. DynamoDB Design Philosophy

-   One entity per table
-   No single-table complexity
-   GSIs added only for required access patterns
-   Deterministic ordering via sort keys
-   All timestamps stored as ISO 8601 strings
-   All IDs stored as strings

------------------------------------------------------------------------

# 6. Data Model Concepts

## Stage Model

Each Objective has exactly three stages:

1.  begin\
2.  walkthrough\
3.  challenge

Stages are ordered via a numeric `order` field.

## Progress Model

Student progress is tracked per objective:

-   `earnedStars` (0--3)
-   `currentStageType`
-   `updatedAt`

Unit-level progress is computed server-side.

## Chat Model

-   One ChatThread per Objective
-   Messages partitioned by threadId
-   Messages sorted by createdAt ascending
-   ThreadWithProgress computed server-side

## Awards & Feedback

-   Partitioned by studentId
-   Filterable by courseId
-   Returned as simple lists (frontend does not paginate)

------------------------------------------------------------------------

# 7. Ordering Guarantees

Backend guarantees deterministic ordering for:

-   Objectives (sorted by `order`)
-   Stages (sorted by `order`)
-   Questions (sorted by `difficultyStars`)
-   Threads (sorted by Objective `order`)
-   Messages (sorted by `createdAt` ascending)

------------------------------------------------------------------------

# 8. Pagination & Batch Safety

All DynamoDB queries use a `query_all()` helper that:

-   Iterates through `LastEvaluatedKey`
-   Returns complete result sets
-   Prevents silent 1MB truncation

All BatchGet operations use `batch_get_all()`:

-   Retries `UnprocessedKeys`
-   Ensures reliability under scale

------------------------------------------------------------------------

# 9. Testing Strategy

## AWS CLI Testing (Historical)

Used during development for:

-   Token generation
-   Direct endpoint validation
-   Seeding data

## Browser-Based Testing (No AWS Credentials)

The backend supports full browser testing using dev-header auth.

Testing includes:

-   Stage progression validation
-   UnitProgress aggregation
-   Chat message ordering
-   Award and feedback retrieval
-   404 validation for missing entities

------------------------------------------------------------------------

# 10. Migration History

Originally implemented in Node.js 24.

Migration to Python involved:

1.  Creating Python Lambda
2.  Correctly configuring handler
3.  Copying environment variables
4.  Switching API Gateway integration
5.  Verifying `/health`
6.  Rebuilding router logic
7.  Reimplementing contract-complete endpoints

Lessons learned:

-   Handler configuration is critical
-   JWT audience must match App Client
-   AccessToken cannot be used --- must use IdToken
-   GSI attribute types must match exactly
-   API Gateway integration must reference correct Lambda

------------------------------------------------------------------------

# 11. Known Pitfalls Encountered

-   GSI sort key type mismatch (String vs Number)
-   Incorrect JWT audience configuration
-   API Gateway still pointing to old Lambda
-   Missing imports during migration
-   Using AccessToken instead of IdToken
-   CORS preflight not handled at API Gateway layer

All issues have been resolved.

------------------------------------------------------------------------

# 12. Current System State

The backend is:

-   Fully contract-complete
-   Serverless
-   Deterministically ordered
-   Pagination-safe
-   Batch-safe
-   Auth-ready (JWT + dev mode)
-   Frontend-ready

All major domain surfaces are implemented:

-   Courses
-   Units
-   Objectives
-   Stages
-   Progress
-   Chat
-   Awards
-   Feedback

------------------------------------------------------------------------

# 13. Production Hardening Checklist

Before production launch:

1.  Disable dev authentication

        DEV_AUTH_ENABLED=false

2.  Re-enable JWT authorizers in API Gateway

3.  Restrict CORS origin to production frontend domain

4.  Add structured logging

5.  Enforce enrollment-based authorization checks

6.  Optionally:

    -   Block advancing beyond 3 stars explicitly
    -   Add pagination parameters for large message lists

------------------------------------------------------------------------

# Conclusion

The Sapiens backend is architecturally sound, contract-aligned, and
production-ready in structure. It supports secure authentication,
deterministic data traversal, scalable DynamoDB access patterns, and a
fully implemented progression and chat model.

This document represents the consolidated architectural reference for
the backend implementation.

End of document.
