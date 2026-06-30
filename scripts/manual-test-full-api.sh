#!/bin/bash

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo ""
echo "Testing DevMind API at: $BASE_URL"
echo ""

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is not installed."
  echo "Install it with: brew install jq"
  exit 1
fi

LAST_RESPONSE_FILE="/tmp/devmind-api-response.json"

request() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_status="$4"
  local token="${5:-}"
  local body="${6:-}"

  local headers=(-H "Content-Type: application/json")

  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$body" ]; then
    status=$(curl -s -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      "${headers[@]}" \
      -d "$body")
  else
    status=$(curl -s -o "$LAST_RESPONSE_FILE" -w "%{http_code}" \
      -X "$method" "$BASE_URL$path" \
      "${headers[@]}")
  fi

  if [ "$status" = "$expected_status" ]; then
    echo "✅ $name → $status"
  else
    echo "❌ $name"
    echo "Expected: $expected_status"
    echo "Received: $status"
    echo ""
    echo "Response:"
    cat "$LAST_RESPONSE_FILE" | jq . 2>/dev/null || cat "$LAST_RESPONSE_FILE"
    echo ""
    exit 1
  fi
}

unique_email() {
  echo "$1-$(date +%s)-$RANDOM@example.com"
}

echo "────────────────────────────────────────"
echo "1. HEALTH"
echo "────────────────────────────────────────"

request "GET /health" "GET" "/health" "200"

echo ""
echo "────────────────────────────────────────"
echo "2. AUTH"
echo "────────────────────────────────────────"

USER_ONE_EMAIL=$(unique_email "user-one")
USER_TWO_EMAIL=$(unique_email "user-two")
PASSWORD="password123"

USER_ONE_REGISTER_BODY=$(jq -nc \
  --arg name "User One" \
  --arg email "$USER_ONE_EMAIL" \
  --arg password "$PASSWORD" \
  '{name:$name,email:$email,password:$password}')

request "POST /auth/register user one" "POST" "/auth/register" "201" "" "$USER_ONE_REGISTER_BODY"

USER_ONE_ID=$(cat "$LAST_RESPONSE_FILE" | jq -r '.user.id')

request "POST /auth/register duplicate email" "POST" "/auth/register" "409" "" "$USER_ONE_REGISTER_BODY"

USER_ONE_LOGIN_BODY=$(jq -nc \
  --arg email "$USER_ONE_EMAIL" \
  --arg password "$PASSWORD" \
  '{email:$email,password:$password}')

request "POST /auth/login user one" "POST" "/auth/login" "200" "" "$USER_ONE_LOGIN_BODY"

USER_ONE_TOKEN=$(cat "$LAST_RESPONSE_FILE" | jq -r '.accessToken')

WRONG_LOGIN_BODY=$(jq -nc \
  --arg email "$USER_ONE_EMAIL" \
  --arg password "wrong-password" \
  '{email:$email,password:$password}')

request "POST /auth/login wrong password" "POST" "/auth/login" "401" "" "$WRONG_LOGIN_BODY"

request "GET /auth/me without token" "GET" "/auth/me" "401"

request "GET /auth/me with token" "GET" "/auth/me" "200" "$USER_ONE_TOKEN"

USER_TWO_REGISTER_BODY=$(jq -nc \
  --arg name "User Two" \
  --arg email "$USER_TWO_EMAIL" \
  --arg password "$PASSWORD" \
  '{name:$name,email:$email,password:$password}')

request "POST /auth/register user two" "POST" "/auth/register" "201" "" "$USER_TWO_REGISTER_BODY"

USER_TWO_LOGIN_BODY=$(jq -nc \
  --arg email "$USER_TWO_EMAIL" \
  --arg password "$PASSWORD" \
  '{email:$email,password:$password}')

request "POST /auth/login user two" "POST" "/auth/login" "200" "" "$USER_TWO_LOGIN_BODY"

USER_TWO_TOKEN=$(cat "$LAST_RESPONSE_FILE" | jq -r '.accessToken')

echo ""
echo "User one id: $USER_ONE_ID"
echo "User one token obtained: yes"
echo "User two token obtained: yes"

echo ""
echo "────────────────────────────────────────"
echo "3. PROJECTS"
echo "────────────────────────────────────────"

PROJECT_BODY=$(jq -nc \
  --arg name "DevMind API" \
  --arg description "Backend with AI" \
  '{name:$name,description:$description}')

request "POST /projects without token" "POST" "/projects" "401" "" "$PROJECT_BODY"

INVALID_PROJECT_BODY=$(jq -nc \
  --arg name "" \
  --arg description "Invalid project" \
  '{name:$name,description:$description}')

request "POST /projects invalid body" "POST" "/projects" "400" "$USER_ONE_TOKEN" "$INVALID_PROJECT_BODY"

request "POST /projects valid" "POST" "/projects" "201" "$USER_ONE_TOKEN" "$PROJECT_BODY"

PROJECT_ID=$(cat "$LAST_RESPONSE_FILE" | jq -r '.id')

SECOND_PROJECT_BODY=$(jq -nc \
  --arg name "Second Project" \
  --arg description "Another project" \
  '{name:$name,description:$description}')

request "POST /projects second valid" "POST" "/projects" "201" "$USER_ONE_TOKEN" "$SECOND_PROJECT_BODY"

SECOND_PROJECT_ID=$(cat "$LAST_RESPONSE_FILE" | jq -r '.id')

request "GET /projects without token" "GET" "/projects" "401"

request "GET /projects with token" "GET" "/projects" "200" "$USER_ONE_TOKEN"

request "GET /projects/:id with owner token" "GET" "/projects/$PROJECT_ID" "200" "$USER_ONE_TOKEN"

request "GET /projects/:id without token" "GET" "/projects/$PROJECT_ID" "401"

request "GET /projects non-existing" "GET" "/projects/non-existing-project" "404" "$USER_ONE_TOKEN"

request "GET /projects/:id from another user" "GET" "/projects/$PROJECT_ID" "404" "$USER_TWO_TOKEN"

request "DELETE /projects/:id without token" "DELETE" "/projects/$SECOND_PROJECT_ID" "401"

request "DELETE /projects/:id from another user" "DELETE" "/projects/$SECOND_PROJECT_ID" "404" "$USER_TWO_TOKEN"

echo ""
echo "Main project id: $PROJECT_ID"
echo "Second project id: $SECOND_PROJECT_ID"

echo ""
echo "────────────────────────────────────────"
echo "4. PROJECT FILES"
echo "────────────────────────────────────────"

FILE_BODY=$(jq -nc \
  --arg path "src/app.ts" \
  --arg language "typescript" \
  --arg content "console.log('hello');" \
  '{path:$path,language:$language,content:$content}')

SECOND_FILE_BODY=$(jq -nc \
  --arg path "src/main.ts" \
  --arg language "typescript" \
  --arg content "console.log('main');" \
  '{path:$path,language:$language,content:$content}')

INVALID_FILE_BODY=$(jq -nc \
  --arg path "" \
  --arg language "" \
  --arg content "console.log('invalid');" \
  '{path:$path,language:$language,content:$content}')

request "POST /projects/:projectId/files without token" "POST" "/projects/$PROJECT_ID/files" "401" "" "$FILE_BODY"

request "POST /projects/:projectId/files invalid body" "POST" "/projects/$PROJECT_ID/files" "400" "$USER_ONE_TOKEN" "$INVALID_FILE_BODY"

request "POST /projects/:projectId/files non-existing project" "POST" "/projects/non-existing-project/files" "404" "$USER_ONE_TOKEN" "$FILE_BODY"

request "POST /projects/:projectId/files another user's project" "POST" "/projects/$PROJECT_ID/files" "404" "$USER_TWO_TOKEN" "$FILE_BODY"

request "POST /projects/:projectId/files valid" "POST" "/projects/$PROJECT_ID/files" "201" "$USER_ONE_TOKEN" "$FILE_BODY"

FILE_ID=$(cat "$LAST_RESPONSE_FILE" | jq -r '.id')

request "POST /projects/:projectId/files second valid" "POST" "/projects/$PROJECT_ID/files" "201" "$USER_ONE_TOKEN" "$SECOND_FILE_BODY"

SECOND_FILE_ID=$(cat "$LAST_RESPONSE_FILE" | jq -r '.id')

request "GET /projects/:projectId/files without token" "GET" "/projects/$PROJECT_ID/files" "401"

request "GET /projects/:projectId/files valid" "GET" "/projects/$PROJECT_ID/files" "200" "$USER_ONE_TOKEN"

request "GET /projects/:projectId/files non-existing project" "GET" "/projects/non-existing-project/files" "404" "$USER_ONE_TOKEN"

request "GET /projects/:projectId/files another user's project" "GET" "/projects/$PROJECT_ID/files" "404" "$USER_TWO_TOKEN"

request "GET /projects/:projectId/files/:fileId without token" "GET" "/projects/$PROJECT_ID/files/$FILE_ID" "401"

request "GET /projects/:projectId/files/:fileId valid" "GET" "/projects/$PROJECT_ID/files/$FILE_ID" "200" "$USER_ONE_TOKEN"

request "GET /projects/:projectId/files/:fileId non-existing project" "GET" "/projects/non-existing-project/files/$FILE_ID" "404" "$USER_ONE_TOKEN"

request "GET /projects/:projectId/files/:fileId non-existing file" "GET" "/projects/$PROJECT_ID/files/non-existing-file" "404" "$USER_ONE_TOKEN"

request "GET /projects/:projectId/files/:fileId another user's project" "GET" "/projects/$PROJECT_ID/files/$FILE_ID" "404" "$USER_TWO_TOKEN"

request "DELETE /projects/:projectId/files/:fileId without token" "DELETE" "/projects/$PROJECT_ID/files/$FILE_ID" "401"

request "DELETE /projects/:projectId/files/:fileId non-existing project" "DELETE" "/projects/non-existing-project/files/$FILE_ID" "404" "$USER_ONE_TOKEN"

request "DELETE /projects/:projectId/files/:fileId non-existing file" "DELETE" "/projects/$PROJECT_ID/files/non-existing-file" "404" "$USER_ONE_TOKEN"

request "DELETE /projects/:projectId/files/:fileId another user's project" "DELETE" "/projects/$PROJECT_ID/files/$FILE_ID" "404" "$USER_TWO_TOKEN"

request "DELETE /projects/:projectId/files/:fileId valid" "DELETE" "/projects/$PROJECT_ID/files/$FILE_ID" "204" "$USER_ONE_TOKEN"

request "GET deleted file should return 404" "GET" "/projects/$PROJECT_ID/files/$FILE_ID" "404" "$USER_ONE_TOKEN"

echo ""
echo "File id deleted: $FILE_ID"
echo "Second file id still exists: $SECOND_FILE_ID"

echo ""
echo "────────────────────────────────────────"
echo "5. FINAL PROJECT DELETE"
echo "────────────────────────────────────────"

request "DELETE /projects/:id valid second project" "DELETE" "/projects/$SECOND_PROJECT_ID" "204" "$USER_ONE_TOKEN"

request "GET deleted second project should return 404" "GET" "/projects/$SECOND_PROJECT_ID" "404" "$USER_ONE_TOKEN"

request "DELETE /projects/:id valid main project" "DELETE" "/projects/$PROJECT_ID" "204" "$USER_ONE_TOKEN"

request "GET deleted main project should return 404" "GET" "/projects/$PROJECT_ID" "404" "$USER_ONE_TOKEN"

echo ""
echo "────────────────────────────────────────"
echo "✅ FULL MANUAL API TEST PASSED"
echo "────────────────────────────────────────"
echo ""
echo "Auth endpoints: OK"
echo "Project endpoints: OK"
echo "ProjectFile endpoints: OK"
echo ""