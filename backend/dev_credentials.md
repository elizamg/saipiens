# Sapiens Dev Credentials

Test accounts in Cognito User Pool `us-west-1_pzs7P5vGg`.
Use these to log in to the app locally or on the deployed Vercel URL.

---

## Student

| Field    | Value                        |
|----------|------------------------------|
| Email    | `dev-student@sapiens.dev`    |
| Password | `SapiensStudent#2026`        |
| Role     | student                      |
| Sub      | `a93979be-50f1-70a4-b9a5-f104ff840272` |

---

## Instructor

| Field    | Value                          |
|----------|--------------------------------|
| Email    | `dev-instructor@sapiens.dev`   |
| Password | `SapiensInstructor#2026`       |
| Role     | instructor (member of `instructors` Cognito group) |
| Sub      | `499989ee-2001-7066-4038-6605c7d0b7dd` |

---

## Notes

- Accounts are pre-confirmed (no email verification needed)
- Passwords are permanent (no forced reset on first login)
- To reset a password: `aws cognito-idp admin-set-user-password --user-pool-id us-west-1_pzs7P5vGg --username <email> --password <new> --permanent`
