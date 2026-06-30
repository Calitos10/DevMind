#!/bin/bash

BASE_URL="http://localhost:3000"

EMAIL="user-$(date +%s)@example.com"
PASSWORD="password123"

echo "1. Register user..."

curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"User One\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }" | jq

echo ""
echo "2. Login user..."

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

echo ""
echo "Access token:"
echo "$ACCESS_TOKEN"

echo ""
echo "3. Create project..."

PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "DevMind API",
    "description": "Backend with AI"
  }')

echo "$PROJECT_RESPONSE" | jq

PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id')

echo ""
echo "Project id:"
echo "$PROJECT_ID"

echo ""
echo "4. Create project file..."

FILE_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/files" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "path": "src/app.ts",
    "language": "typescript",
    "content": "console.log('\''hello'\'');"
  }')

echo "$FILE_RESPONSE" | jq

FILE_ID=$(echo "$FILE_RESPONSE" | jq -r '.id')

echo ""
echo "File id:"
echo "$FILE_ID"

echo ""
echo "5. List project files..."

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/files" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo ""
echo "6. Get project file by id..."

curl -s -X GET "$BASE_URL/projects/$PROJECT_ID/files/$FILE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

echo ""
echo "7. Delete project file..."

DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/projects/$PROJECT_ID/files/$FILE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "DELETE status: $DELETE_STATUS"

echo ""
echo "8. Try to get deleted file. Expected 404..."

GET_DELETED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE_URL/projects/$PROJECT_ID/files/$FILE_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "GET deleted file status: $GET_DELETED_STATUS"

echo ""
echo "Manual test finished."