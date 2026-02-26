# Cognito Setup (Sapiens)

## User Pool

| Field | Value |
|-------|-------|
| Pool Name | `sapiens` |
| Pool ID | `us-west-1_pzs7P5vGg` |
| Region | `us-west-1` |
| Sign-in method | Email |
| MFA | Off |
| Email verification | Auto-verified on creation |
| Deletion protection | Active |

### Password Policy
- Minimum 8 characters
- No uppercase/lowercase/number/symbol requirements (relaxed for dev ease)

### Required Attributes
- `email`
- `given_name`
- `family_name`

### Custom Attributes
- `custom:role_requested` — set at signup to `"instructor"` or `"student"`. Used to flag accounts for manual promotion to the `instructors` group. Not used for authorization decisions.

### Groups
| Group | Purpose |
|-------|---------|
| `instructors` | Users in this group receive `cognito:groups: ["instructors"]` in their JWT. The Lambda checks this claim to grant instructor-level access. Students are anyone NOT in this group. |

---

## App Client

| Field | Value |
|-------|-------|
| Client Name | `sapiens-public` |
| Client ID | `34es28m8ocaom5rt55khms7p07` |
| Client Secret | None (public SPA client) |
| Auth flows | `ALLOW_USER_SRP_AUTH`, `ALLOW_USER_PASSWORD_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH` |
| Access token validity | 60 minutes |
| ID token validity | 60 minutes |
| Refresh token validity | 30 days |

---

## Dev Accounts

| Role | Email | Password | Cognito Sub | DynamoDB ID |
|------|-------|----------|-------------|-------------|
| Student | `dev-student@sapiens.dev` | `Sapiens123!` | `a93979be-50f1-70a4-b9a5-f104ff840272` | same as sub |
| Instructor | `dev-instructor@sapiens.dev` | `Sapiens123!` | `499989ee-2001-7066-4038-6605c7d0b7dd` | same as sub |

The instructor account is in the `instructors` Cognito group.

Both accounts have corresponding records in DynamoDB:
- `Students` table: dev student sub
- `Instructors` table: dev instructor sub

The dev student is enrolled in `course-demo-001` via the `Enrollments` table.

---

## Lambda Environment Variables (auth-related)

| Variable | Value | Notes |
|----------|-------|-------|
| `COGNITO_USER_POOL_ID` | `us-west-1_pzs7P5vGg` | Used to build JWKS URL |
| `COGNITO_REGION` | `us-west-1` | Used to build JWKS URL and issuer claim |
| `COGNITO_CLIENT_ID` | `34es28m8ocaom5rt55khms7p07` | For future audience validation |
| `DEV_AUTH_ENABLED` | `true` | Set to `false` in production |
| `DEV_AUTH_TOKEN` | `dev-secret` | Shared secret for dev header auth |
| `DEV_AUTH_HEADER` | `X-Dev-Student-Id` | Dev student ID header name |
| `DEV_INSTRUCTOR_ENABLED` | `true` | Set to `false` in production |
| `DEV_INSTRUCTOR_HEADER` | `X-Dev-Instructor-Id` | Dev instructor ID header name |

---

## Frontend .env.local (not committed)

```
VITE_API_BASE_URL=https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-west-1_pzs7P5vGg
VITE_COGNITO_CLIENT_ID=34es28m8ocaom5rt55khms7p07

# Dev fallback headers — remove once JWT auth is confirmed end-to-end:
VITE_DEV_STUDENT_ID=a93979be-50f1-70a4-b9a5-f104ff840272
VITE_DEV_TOKEN=dev-secret
VITE_DEV_INSTRUCTOR_ID=499989ee-2001-7066-4038-6605c7d0b7dd
```

---

## Auth Flow (current implementation)

### Frontend
1. User logs in or signs up via the React login/signup form
2. `AuthContext` calls `amazon-cognito-identity-js` to authenticate against Cognito
3. Cognito returns an ID token (JWT), access token, and refresh token
4. `AuthContext` exposes `getToken()` which fetches a fresh ID token (auto-refreshing)
5. `api.ts` calls `getToken()` before every request and sends `Authorization: Bearer <id_token>`

### Lambda (backend)
1. Receives `Authorization: Bearer <id_token>` header
2. Fetches Cognito JWKS from `https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/jwks.json`
   - JWKS is cached in-memory for 1 hour to avoid repeated network calls
3. Verifies RS256 JWT signature using the matching public key from JWKS
4. Validates claims: `exp` (not expired), `iss` (matches this pool), `token_use=id`
5. Extracts `sub` as the user's primary ID
6. Extracts `cognito:groups` to determine role: `instructors` group → instructor, otherwise → student
7. Falls back to dev headers (`X-Dev-Student-Id`, `X-Dev-Instructor-Id`) if `DEV_AUTH_ENABLED=true`

### New User Auto-Provisioning
When a user signs up via Cognito and hits `/current-student` for the first time:
- Lambda extracts `given_name` and `family_name` from the JWT payload
- Creates a new record in the `Students` DynamoDB table with their `sub` as the ID
- Uses conditional write (`attribute_not_exists(id)`) to prevent duplicate creation

### Instructor Signup Flow
- On signup, users can check "I am an instructor"
- The frontend sets `custom:role_requested = "instructor"` as a Cognito attribute
- The user is NOT automatically added to the `instructors` group
- An admin must manually promote them: see "Promoting a User to Instructor" below
- Until promoted, the user is treated as a student

---

## Promoting a User to Instructor

```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id us-west-1_pzs7P5vGg \
  --username <email-or-sub> \
  --group-name instructors \
  --region us-west-1
```

The user must log out and back in (or refresh their token) for the group to appear in their JWT.

To check who has requested instructor status:
```bash
aws cognito-idp list-users \
  --user-pool-id us-west-1_pzs7P5vGg \
  --filter 'custom:role_requested = "instructor"' \
  --region us-west-1
```

---

## TODO: Remaining Auth Work

- [ ] Disable dev auth headers once JWT is confirmed stable in production
  - Set `DEV_AUTH_ENABLED=false` and `DEV_INSTRUCTOR_ENABLED=false` in Lambda env vars
- [ ] Add API Gateway JWT Authorizer (optional — Lambda verifies JWTs directly now, but adding a gateway-level authorizer adds early rejection before Lambda runs)
- [ ] Auto-create Instructor DynamoDB record on first instructor login (mirror the student auto-provisioning in `handle_current_student`)
- [ ] Restrict CORS `Access-Control-Allow-Origin` to the production frontend domain
- [ ] Handle token refresh gracefully in the frontend (currently relies on `amazon-cognito-identity-js` auto-refresh)
