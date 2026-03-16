#!/bin/bash
# Comprehensive API Test Script for Sapiens

BASE="https://4bo5f0giwi.execute-api.us-west-1.amazonaws.com/prod"

# Get fresh tokens
cd "$(dirname "$0")/frontend"
eval $(node -e "
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const poolData = { UserPoolId: 'us-west-1_pzs7P5vGg', ClientId: '34es28m8ocaom5rt55khms7p07' };
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
function getToken(email, password) {
  return new Promise((resolve, reject) => {
    const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({ Username: email, Password: password });
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => resolve(result.getIdToken().getJwtToken()),
      onFailure: (err) => reject(err)
    });
  });
}
Promise.all([
  getToken('dev-student@sapiens.dev', 'SapiensStudent#2026'),
  getToken('dev-instructor@sapiens.dev', 'SapiensInstructor#2026')
]).then(([st, it]) => {
  console.log('export STUDENT_TOKEN=\"' + st + '\"');
  console.log('export INSTRUCTOR_TOKEN=\"' + it + '\"');
});
" 2>/dev/null)
cd ..

STUDENT_ID="a93979be-50f1-70a4-b9a5-f104ff840272"
INSTRUCTOR_ID="499989ee-2001-7066-4038-6605c7d0b7dd"

PASS=0
FAIL=0
RESULTS=""

test_api() {
  local test_name="$1"
  local method="$2"
  local path="$3"
  local token="$4"
  local body="$5"
  local expected_status="$6"

  if [ -z "$expected_status" ]; then expected_status=200; fi

  local curl_args=(-s -w "\n%{http_code}" -H "Authorization: Bearer $token" -H "Content-Type: application/json")

  if [ "$method" = "POST" ]; then
    curl_args+=(-X POST)
    if [ -n "$body" ]; then curl_args+=(-d "$body"); fi
  elif [ "$method" = "PUT" ]; then
    curl_args+=(-X PUT -d "$body")
  elif [ "$method" = "PATCH" ]; then
    curl_args+=(-X PATCH -d "$body")
  elif [ "$method" = "DELETE" ]; then
    curl_args+=(-X DELETE)
  fi

  local response=$(curl "${curl_args[@]}" "$BASE$path")
  local status_code=$(echo "$response" | tail -1)
  local response_body=$(echo "$response" | sed '$d')

  if [ "$status_code" = "$expected_status" ]; then
    PASS=$((PASS + 1))
    RESULTS+="| PASS | $test_name | $method $path | $status_code | - |\n"
    echo "PASS: $test_name ($status_code)"
  else
    FAIL=$((FAIL + 1))
    local short_body=$(echo "$response_body" | head -c 100)
    RESULTS+="| FAIL | $test_name | $method $path | $status_code (expected $expected_status) | $short_body |\n"
    echo "FAIL: $test_name (got $status_code, expected $expected_status) - $short_body"
  fi
}

echo "=========================================="
echo "  SAPIENS API TEST SUITE"
echo "=========================================="
echo ""

# ---- AUTHENTICATION ----
echo "--- Authentication Tests ---"
test_api "Health check" GET "/health" "" "" 200
test_api "Get current student" GET "/current-student" "$STUDENT_TOKEN"
test_api "Get current instructor" GET "/current-instructor" "$INSTRUCTOR_TOKEN"
test_api "Unauthenticated request rejected" GET "/current-student" "invalid-token" "" 401

# ---- INSTRUCTOR: COURSE MANAGEMENT ----
echo ""
echo "--- Instructor: Course Management ---"
test_api "List instructor courses" GET "/instructor/courses" "$INSTRUCTOR_TOKEN"
test_api "List all students" GET "/students" "$INSTRUCTOR_TOKEN"

# Create a test course
echo "Creating test course..."
CREATE_RESP=$(curl -s -H "Authorization: Bearer $INSTRUCTOR_TOKEN" -H "Content-Type: application/json" -X POST -d '{"title":"Test Course API","icon":"science"}' "$BASE/courses")
COURSE_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$COURSE_ID" ] && [ "$COURSE_ID" != "" ]; then
  PASS=$((PASS + 1))
  echo "PASS: Create course (id=$COURSE_ID)"
  RESULTS+="| PASS | Create course | POST /courses | 201 | id=$COURSE_ID |\n"
else
  FAIL=$((FAIL + 1))
  echo "FAIL: Create course - $CREATE_RESP"
  RESULTS+="| FAIL | Create course | POST /courses | ? | $CREATE_RESP |\n"
  COURSE_ID="NONE"
fi

test_api "Get created course" GET "/courses/$COURSE_ID" "$INSTRUCTOR_TOKEN"
test_api "Update course title" PATCH "/courses/$COURSE_ID/title" "$INSTRUCTOR_TOKEN" '{"title":"Updated Test Course"}'

# ---- ROSTER MANAGEMENT ----
echo ""
echo "--- Roster Management ---"
test_api "Get course roster (empty)" GET "/courses/$COURSE_ID/roster" "$INSTRUCTOR_TOKEN"

# Create a test student
CREATE_STU_RESP=$(curl -s -H "Authorization: Bearer $INSTRUCTOR_TOKEN" -H "Content-Type: application/json" -X POST -d '{"name":"Test Student","yearLabel":"Year 2"}' "$BASE/students")
TEST_STUDENT_ID=$(echo "$CREATE_STU_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$TEST_STUDENT_ID" ] && [ "$TEST_STUDENT_ID" != "" ]; then
  PASS=$((PASS + 1))
  echo "PASS: Create student (id=$TEST_STUDENT_ID)"
  RESULTS+="| PASS | Create student | POST /students | 201 | id=$TEST_STUDENT_ID |\n"
else
  FAIL=$((FAIL + 1))
  echo "FAIL: Create student - $CREATE_STU_RESP"
  RESULTS+="| FAIL | Create student | POST /students | ? | $CREATE_STU_RESP |\n"
  TEST_STUDENT_ID="NONE"
fi

# Enroll student + dev student
test_api "Update roster (enroll students)" PUT "/courses/$COURSE_ID/roster" "$INSTRUCTOR_TOKEN" "{\"studentIds\":[\"$STUDENT_ID\",\"$TEST_STUDENT_ID\"]}"
test_api "Get roster after enrollment" GET "/courses/$COURSE_ID/roster" "$INSTRUCTOR_TOKEN"

# ---- STUDENT: COURSES ----
echo ""
echo "--- Student: Course Access ---"
test_api "Student list courses" GET "/students/$STUDENT_ID/courses" "$STUDENT_TOKEN"
test_api "Student get course" GET "/courses/$COURSE_ID" "$STUDENT_TOKEN"

# ---- UNIT MANAGEMENT ----
echo ""
echo "--- Unit Management ---"
test_api "List units (empty course)" GET "/courses/$COURSE_ID/units" "$INSTRUCTOR_TOKEN"

# Create unit via upload
UPLOAD_RESP=$(curl -s -H "Authorization: Bearer $INSTRUCTOR_TOKEN" -H "Content-Type: application/json" -X POST -d '{"unitName":"Test Unit","fileNames":["test.pdf"]}' "$BASE/courses/$COURSE_ID/units/upload")
UNIT_ID=$(echo "$UPLOAD_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('unitId',''))" 2>/dev/null)
UPLOAD_URLS=$(echo "$UPLOAD_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('uploadUrls',{})))" 2>/dev/null)
if [ -n "$UNIT_ID" ] && [ "$UNIT_ID" != "" ]; then
  PASS=$((PASS + 1))
  echo "PASS: Create unit via upload (id=$UNIT_ID, urls=$UPLOAD_URLS)"
  RESULTS+="| PASS | Create unit via upload | POST /courses/$COURSE_ID/units/upload | 201 | id=$UNIT_ID |\n"
else
  FAIL=$((FAIL + 1))
  echo "FAIL: Create unit - $UPLOAD_RESP"
  RESULTS+="| FAIL | Create unit via upload | POST /courses/$COURSE_ID/units/upload | ? | $UPLOAD_RESP |\n"
  UNIT_ID="NONE"
fi

test_api "Get unit" GET "/units/$UNIT_ID" "$INSTRUCTOR_TOKEN"
test_api "Get upload status" GET "/units/$UNIT_ID/upload-status" "$INSTRUCTOR_TOKEN"
test_api "List units" GET "/courses/$COURSE_ID/units" "$INSTRUCTOR_TOKEN"

# ---- UNIT OPERATIONS ----
echo ""
echo "--- Unit Operations ---"
test_api "Update unit deadline" PATCH "/units/$UNIT_ID/deadline" "$INSTRUCTOR_TOKEN" '{"deadline":"2026-04-01T23:59:00Z"}'
test_api "List unit files" GET "/units/$UNIT_ID/files" "$INSTRUCTOR_TOKEN"
test_api "Get identified knowledge" GET "/units/$UNIT_ID/identified-knowledge" "$INSTRUCTOR_TOKEN"

# ---- OBJECTIVES ----
echo ""
echo "--- Objectives ---"
test_api "List objectives (may be empty)" GET "/units/$UNIT_ID/objectives" "$INSTRUCTOR_TOKEN"

# ---- STUDENT: UNIT ACCESS ----
echo ""
echo "--- Student: Unit Access ---"
test_api "Student list units" GET "/courses/$COURSE_ID/units" "$STUDENT_TOKEN"
test_api "Student get unit" GET "/units/$UNIT_ID" "$STUDENT_TOKEN"

# ---- AWARDS & FEEDBACK ----
echo ""
echo "--- Awards & Feedback ---"
test_api "Student list awards" GET "/awards" "$STUDENT_TOKEN"
test_api "Student list feedback" GET "/feedback" "$STUDENT_TOKEN"
test_api "Student course awards" GET "/courses/$COURSE_ID/awards" "$STUDENT_TOKEN"
test_api "Student course feedback" GET "/courses/$COURSE_ID/feedback" "$STUDENT_TOKEN"

# ---- GRADING REPORTS ----
echo ""
echo "--- Grading Reports ---"
test_api "Student my grading report" GET "/units/$UNIT_ID/my-grading-report" "$STUDENT_TOKEN"
test_api "Student my feedback" GET "/units/$UNIT_ID/my-feedback" "$STUDENT_TOKEN"
test_api "Teacher grading report" GET "/units/$UNIT_ID/grading-report?studentId=$STUDENT_ID" "$INSTRUCTOR_TOKEN"

# ---- TEACHER FEEDBACK ----
echo ""
echo "--- Teacher Feedback ---"
FEEDBACK_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $INSTRUCTOR_TOKEN" -H "Content-Type: application/json" -X POST -d "{\"studentId\":\"$STUDENT_ID\",\"body\":\"Great work on this unit!\"}" "$BASE/units/$UNIT_ID/feedback")
FEEDBACK_STATUS=$(echo "$FEEDBACK_RESP" | tail -1)
FEEDBACK_BODY=$(echo "$FEEDBACK_RESP" | sed '$d')
if [ "$FEEDBACK_STATUS" = "200" ] || [ "$FEEDBACK_STATUS" = "201" ]; then
  PASS=$((PASS + 1))
  echo "PASS: Create teacher feedback ($FEEDBACK_STATUS)"
  RESULTS+="| PASS | Create teacher feedback | POST /units/$UNIT_ID/feedback | $FEEDBACK_STATUS | - |\n"
else
  FAIL=$((FAIL + 1))
  echo "FAIL: Create teacher feedback ($FEEDBACK_STATUS) - $(echo $FEEDBACK_BODY | head -c 100)"
  RESULTS+="| FAIL | Create teacher feedback | POST /units/$UNIT_ID/feedback | $FEEDBACK_STATUS | $(echo $FEEDBACK_BODY | head -c 100) |\n"
fi

test_api "Teacher get feedback for student" GET "/units/$UNIT_ID/feedback?studentId=$STUDENT_ID" "$INSTRUCTOR_TOKEN"
test_api "Student read feedback" GET "/units/$UNIT_ID/my-feedback" "$STUDENT_TOKEN"

# ---- KNOWLEDGE QUEUE ----
echo ""
echo "--- Knowledge Queue ---"
test_api "Knowledge queue" GET "/units/$UNIT_ID/knowledge-queue" "$STUDENT_TOKEN"
test_api "Knowledge progress" GET "/units/$UNIT_ID/knowledge-progress" "$STUDENT_TOKEN"
test_api "Knowledge topics" GET "/units/$UNIT_ID/knowledge-topics" "$INSTRUCTOR_TOKEN"

# ---- STUDENT PROGRESS ----
echo ""
echo "--- Student Progress ---"
test_api "Unit progress" GET "/units/$UNIT_ID/progress" "$STUDENT_TOKEN"
test_api "Unit progress items" GET "/units/$UNIT_ID/progress/items" "$STUDENT_TOKEN"

# ---- CHAT THREADS ----
echo ""
echo "--- Chat Threads ---"
test_api "List threads" GET "/units/$UNIT_ID/threads" "$STUDENT_TOKEN"

# ---- BATCH INSTRUCTOR LOOKUP ----
echo ""
echo "--- Batch Operations ---"
test_api "Batch get instructors" POST "/instructors/batch" "$STUDENT_TOKEN" "{\"ids\":[\"$INSTRUCTOR_ID\"]}"

# ---- CLEANUP ----
echo ""
echo "--- Cleanup ---"
test_api "Delete unit (soft)" DELETE "/units/$UNIT_ID" "$INSTRUCTOR_TOKEN"
test_api "Delete course (soft)" DELETE "/courses/$COURSE_ID" "$INSTRUCTOR_TOKEN"

# ---- CROSS-ROLE TESTS ----
echo ""
echo "--- Cross-Role Security ---"
test_api "Student cannot access instructor endpoint" GET "/current-instructor" "$STUDENT_TOKEN" "" 403
test_api "Student cannot create course" POST "/courses" "$STUDENT_TOKEN" '{"title":"Hacked"}' 403

echo ""
echo "=========================================="
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "=========================================="
echo ""
echo -e "$RESULTS"
