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

### Groups
| Group | Purpose |
|-------|---------|
| `instructors` | Users in this group are treated as instructors by the Lambda. If a user's JWT does NOT contain `instructors` in `cognito:groups`, they are treated as a student. |

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

## Lambda Environment Variables (relevant to auth)

| Variable | Value |
|----------|-------|
| `COGNITO_USER_POOL_ID` | `us-west-1_pzs7P5vGg` |
| `COGNITO_REGION` | `us-west-1` |
| `DEV_AUTH_ENABLED` | `true` (set to `false` once JWT auth is wired) |
| `DEV_AUTH_TOKEN` | `dev-secret` |
| `DEV_AUTH_HEADER` | `X-Dev-Student-Id` |
| `DEV_INSTRUCTOR_ENABLED` | `true` (set to `false` once JWT auth is wired) |
| `DEV_INSTRUCTOR_HEADER` | `X-Dev-Instructor-Id` |

---

## Frontend .env.local (not committed)

```
VITE_API_BASE_URL=https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-west-1_pzs7P5vGg
VITE_COGNITO_CLIENT_ID=34es28m8ocaom5rt55khms7p07

# Remove these once JWT auth is wired:
VITE_DEV_STUDENT_ID=a93979be-50f1-70a4-b9a5-f104ff840272
VITE_DEV_TOKEN=dev-secret
VITE_DEV_INSTRUCTOR_ID=499989ee-2001-7066-4038-6605c7d0b7dd
```

---

## Auth Flow (target — once JWT is wired)

1. User logs in via the React login form
2. Frontend calls Cognito to authenticate → receives ID token (JWT)
3. Frontend stores token (memory or localStorage)
4. Every API request includes `Authorization: Bearer <id_token>`
5. Lambda verifies the JWT signature against the Cognito public keys
6. Lambda extracts `sub` as the user ID and `cognito:groups` to determine role
7. If `instructors` group is present → instructor routes; otherwise → student routes

---

## TODO: Remaining Cognito work

- [ ] Install auth library in frontend (`amazon-cognito-identity-js` or Amplify Auth)
- [ ] Wire login/signup forms to real Cognito auth
- [ ] Update `AuthContext` to store and expose the JWT token
- [ ] Update `apiFetch` in `api.ts` to send `Authorization: Bearer <token>` instead of dev headers
- [ ] Update `lambda_handler.py` to verify JWT and extract `sub` + groups
- [ ] Add JWT authorizer to API Gateway (optional — can do in Lambda instead)
- [ ] Set `DEV_AUTH_ENABLED=false` and `DEV_INSTRUCTOR_ENABLED=false` in Lambda env
- [ ] Handle token refresh (use refresh token before expiry)
- [ ] Handle signup flow — create DynamoDB record on first login (Post Confirmation Lambda trigger or manual)
