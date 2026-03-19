"""
Seed script: creates Ms. Gallagher (instructor) + 20 students in Cognito + DynamoDB,
then enrolls students in a demo course owned by Ms. Gallagher.
"""
import boto3
import uuid
from datetime import datetime, timezone

REGION = "us-west-1"
USER_POOL_ID = "us-west-1_pzs7P5vGg"
TEMP_PASSWORD = "Sapiens#Temp1"   # Force-changed on first login via admin-set-user-password
STUDENT_PASSWORD = "Student#2026"
GALLAGHER_PASSWORD = "Gallagher#2026"

cognito = boto3.client("cognito-idp", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)

students_tbl = dynamodb.Table("Students")
instructors_tbl = dynamodb.Table("Instructors")
courses_tbl = dynamodb.Table("Courses")
enrollments_tbl = dynamodb.Table("Enrollments")

now = datetime.now(timezone.utc).isoformat()

STUDENTS = [
    ("Emma",      "Thompson"),
    ("Liam",      "Johnson"),
    ("Olivia",    "Davis"),
    ("Noah",      "Martinez"),
    ("Ava",       "Wilson"),
    ("William",   "Anderson"),
    ("Sophia",    "Taylor"),
    ("James",     "Thomas"),
    ("Isabella",  "Jackson"),
    ("Oliver",    "White"),
    ("Mia",       "Harris"),
    ("Benjamin",  "Martin"),
    ("Charlotte", "Garcia"),
    ("Elijah",    "Lee"),
    ("Amelia",    "Perez"),
    ("Lucas",     "Walker"),
    ("Harper",    "Hall"),
    ("Mason",     "Allen"),
    ("Evelyn",    "Young"),
    ("Aiden",     "King"),
]


def create_cognito_user(email, given_name, family_name, permanent_password):
    """Create a Cognito user and set a permanent password. Returns the sub (user ID)."""
    try:
        resp = cognito.admin_create_user(
            UserPoolId=USER_POOL_ID,
            Username=email,
            TemporaryPassword=TEMP_PASSWORD,
            UserAttributes=[
                {"Name": "email",          "Value": email},
                {"Name": "email_verified", "Value": "true"},
                {"Name": "given_name",     "Value": given_name},
                {"Name": "family_name",    "Value": family_name},
            ],
            MessageAction="SUPPRESS",  # Don't send welcome email
        )
        sub = next(a["Value"] for a in resp["User"]["Attributes"] if a["Name"] == "sub")
    except cognito.exceptions.UsernameExistsException:
        print(f"  [skip] {email} already exists in Cognito — fetching sub")
        resp = cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=email)
        sub = next(a["Value"] for a in resp["UserAttributes"] if a["Name"] == "sub")

    # Set permanent password (bypasses FORCE_CHANGE_PASSWORD status)
    cognito.admin_set_user_password(
        UserPoolId=USER_POOL_ID,
        Username=email,
        Password=permanent_password,
        Permanent=True,
    )
    return sub


# ── 1. Create Ms. Gallagher ────────────────────────────────────────────────────
print("\n── Creating Ms. Gallagher ──")
gallagher_email = "ms.gallagher@sapiens.dev"
gallagher_sub = create_cognito_user(gallagher_email, "Margaret", "Gallagher", GALLAGHER_PASSWORD)
print(f"  Cognito sub: {gallagher_sub}")

# Add to instructors group
try:
    cognito.admin_add_user_to_group(
        UserPoolId=USER_POOL_ID,
        Username=gallagher_email,
        GroupName="instructors",
    )
    print("  Added to 'instructors' group")
except Exception as e:
    print(f"  Group add note: {e}")

# Write Instructors DynamoDB record
instructors_tbl.put_item(Item={
    "id":        gallagher_sub,
    "name":      "Ms. Gallagher",
    "avatarUrl": None,
    "createdAt": now,
    "updatedAt": now,
})
print("  DynamoDB Instructors record created")

# ── 2. Create course for Ms. Gallagher ────────────────────────────────────────
print("\n── Creating demo course ──")
course_id = str(uuid.uuid4())
courses_tbl.put_item(Item={
    "id":           course_id,
    "title":        "Ms. Gallagher's Class",
    "icon":         "general",
    "instructorIds": [gallagher_sub],
    "studentCount": 20,
    "createdAt":    now,
    "updatedAt":    now,
})
print(f"  Course ID: {course_id}")

# ── 3. Create 20 students ─────────────────────────────────────────────────────
print("\n── Creating 20 students ──")
student_subs = []
for first, last in STUDENTS:
    email = f"{first.lower()}.{last.lower()}@sapiens.dev"
    sub = create_cognito_user(email, first, last, STUDENT_PASSWORD)
    student_subs.append(sub)

    # Write Students DynamoDB record
    students_tbl.put_item(Item={
        "id":        sub,
        "name":      f"{first} {last}",
        "yearLabel": "Student",
        "avatarUrl": None,
        "createdAt": now,
        "updatedAt": now,
    })

    # Enroll in Ms. Gallagher's course
    enrollments_tbl.put_item(Item={
        "studentId":  sub,
        "courseId":   course_id,
        "enrolledAt": now,
    })
    print(f"  ✓ {first} {last} ({email})")

# ── 4. Print login summary ────────────────────────────────────────────────────
print("\n" + "="*55)
print("SETUP COMPLETE")
print("="*55)
print(f"\nMs. Gallagher (instructor)")
print(f"  Email:    ms.gallagher@sapiens.dev")
print(f"  Password: {GALLAGHER_PASSWORD}")
print(f"  Role:     instructor (Cognito group: instructors)")
print(f"\nSample student (Emma Thompson)")
print(f"  Email:    emma.thompson@sapiens.dev")
print(f"  Password: {STUDENT_PASSWORD}")
print(f"\nAll 20 students share password: {STUDENT_PASSWORD}")
print(f"Email pattern: firstname.lastname@sapiens.dev")
print(f"\nCourse: 'Ms. Gallagher's Class' (ID: {course_id})")
print(f"All 20 students enrolled.")
print("="*55 + "\n")
