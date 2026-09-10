#!/bin/bash
BASE="http://98.130.20.52:4000"

echo "=== Super Admin API Smoke Test ==="
echo ""

# 1. Login
echo "1. POST /api/v1/admin/login"
RESP=$(curl -s -X POST "$BASE/api/v1/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@entrymyslot.com","password":"admin123"}')
echo "$RESP"
TOKEN=$(echo "$RESP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "FAILED: Could not get token. Stopping tests."
  exit 1
fi
echo ""
echo "Token obtained successfully"

AUTH="Authorization: Bearer $TOKEN"
PASS=0
FAIL=0

check() {
  local LABEL="$1"
  local METHOD="$2"
  local URL="$3"
  local DATA="$4"
  if [ "$METHOD" = "POST" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$URL" -H "Content-Type: application/json" -H "$AUTH" -d "$DATA")
  else
    RESP=$(curl -s -w "\n%{http_code}" -X GET "$URL" -H "$AUTH")
  fi
  HTTP_CODE=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  SUCCESS=$(echo "$BODY" | python3 -c "import sys,json;d=json.load(sys.stdin);print('true' if d.get('success') else 'false')" 2>/dev/null || echo "parse_err")
  
  if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ] && [ "$SUCCESS" = "true" ]; then
    echo "  PASS ($HTTP_CODE) $LABEL"
    PASS=$((PASS+1))
  else
    echo "  FAIL ($HTTP_CODE) $LABEL"
    echo "    Body: $(echo "$BODY" | head -c 300)"
    FAIL=$((FAIL+1))
  fi
}

check "Me" GET "$BASE/api/v1/admin/me" ""
check "Stats" GET "$BASE/api/v1/admin/stats" ""
check "Events" GET "$BASE/api/v1/admin/events" ""
check "Organizations" GET "$BASE/api/v1/admin/organizations" ""
check "Managers" GET "$BASE/api/v1/admin/managers" ""
check "Movies" GET "$BASE/api/v1/admin/movies" ""
check "Cinemas" GET "$BASE/api/v1/admin/movies/cinemas" ""
check "Showtimes" GET "$BASE/api/v1/admin/showtimes" ""
check "Banners" GET "$BASE/api/v1/admin/banners" ""
check "Media" GET "$BASE/api/v1/admin/media" ""
check "Bookings" GET "$BASE/api/v1/admin/bookings" ""
check "Users" GET "$BASE/api/v1/admin/users" ""
check "Refunds" GET "$BASE/api/v1/admin/refunds" ""
check "Audit Logs" GET "$BASE/api/v1/admin/audit-logs" ""
check "Admins/Team" GET "$BASE/api/v1/admin/admins" ""
check "Organizer Apps" GET "$BASE/api/v1/admin/organizer-applications" ""
check "Recent Tickets" GET "$BASE/api/v1/admin/recent-tickets" ""
check "Turf Grounds" GET "$BASE/api/v1/admin/turf/grounds" ""
check "Create Org" POST "$BASE/api/v1/admin/organizations" '{"name":"Test Org","email":"test@test.com","type":"event","city":"Bangalore"}'
check "Create Movie" POST "$BASE/api/v1/admin/movies" '{"title":"Test Movie","genre":"Action","language":"English"}'
check "Create Manager" POST "$BASE/api/v1/admin/managers" '{"name":"Test Manager","email":"manager@test.com","organization_id":"org-001"}'

echo ""
echo "=== Results: $PASS passed, $FAIL failed out of $((PASS+FAIL)) ==="
if [ $FAIL -eq 0 ]; then
  echo "ALL TESTS PASSED!"
else
  echo "Some tests failed - check details above"
fi
