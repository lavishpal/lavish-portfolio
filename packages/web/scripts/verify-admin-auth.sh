#!/usr/bin/env bash
#
# End-to-end check of the /admin authorization rules against a running server.
#
# It asserts that unauthenticated callers get 401, signed-in but non-allowlisted
# callers get 403, and an allowlisted admin can create / edit / publish / delete.
# It creates two throwaway accounts and one throwaway post, then deletes the post.
# Remove the two probe users afterwards if you ran it against a real database.
#
# Usage — start a server whose allowlist contains the probe admin, then run this:
#
#   PORT=4555 ADMIN_EMAILS=admin-probe@example.com WEBSITE_URL=http://localhost:4555 \
#     bun packages/web/src/__server.ts &
#   BASE=http://localhost:4555 bash packages/web/scripts/verify-admin-auth.sh
#
set -u
B=${BASE:-http://localhost:4555}
pass=0; fail=0
chk() { # chk <name> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "PASS  $1 ($3)"; pass=$((pass+1));
  else echo "FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
rpc() { # rpc <path> <token> <json>
  curl -s -o /tmp/rpcbody -w "%{http_code}" -X POST "$B/api/rpc/$1" \
    -H 'Content-Type: application/json' \
    ${2:+-H "Authorization: Bearer $2"} -d "{\"json\":${3:-{\}}}"
}
signup() { curl -s -D /tmp/h -o /tmp/b -X POST "$B/api/auth/sign-up/email" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"$2\",\"name\":\"$3\"}" >/dev/null
  grep -i '^set-auth-token:' /tmp/h | tr -d '\r' | awk '{print $2}'; }

echo "== 1. unauthenticated =="
chk "posts.adminList unauth -> 401" 401 "$(rpc posts/adminList '' '{}')"
chk "posts.create unauth -> 401"    401 "$(rpc posts/create '' '{"title":"x","slug":"x-unauth","excerpt":"","content":"","tags":[],"status":"draft"}')"
chk "upload.presign unauth -> 401"  401 "$(rpc upload/presign '' '{"filename":"a.png","contentType":"image/png"}')"
chk "posts.remove unauth -> 401"    401 "$(rpc posts/remove '' '{"id":1}')"
chk "posts.list public -> 200"      200 "$(rpc posts/list '' '{}')"

echo "== 2. authenticated non-admin =="
NA=$(signup "nonadmin-probe@example.com" "Probe-pass-9987" "Non Admin")
[ -n "$NA" ] && echo "  (non-admin token acquired)" || echo "  (NO TOKEN — signup failed)"
chk "posts.adminList non-admin -> 403" 403 "$(rpc posts/adminList "$NA" '{}')"
cat /tmp/rpcbody; echo
chk "posts.create non-admin -> 403"    403 "$(rpc posts/create "$NA" '{"title":"x","slug":"x-nonadmin","excerpt":"","content":"","tags":[],"status":"draft"}')"
chk "posts.remove non-admin -> 403"    403 "$(rpc posts/remove "$NA" '{"id":1}')"
chk "upload.presign non-admin -> 403"  403 "$(rpc upload/presign "$NA" '{"filename":"a.png","contentType":"image/png"}')"

echo "== 3. allowlisted admin =="
AD=$(signup "admin-probe@example.com" "Probe-pass-9987" "Admin Probe")
[ -n "$AD" ] && echo "  (admin token acquired)" || echo "  (NO TOKEN — signup failed)"
chk "posts.adminList admin -> 200" 200 "$(rpc posts/adminList "$AD" '{}')"
chk "posts.create admin -> 200" 200 "$(rpc posts/create "$AD" '{"title":"Probe Post","slug":"zz-probe-post","excerpt":"probe","content":"# probe\n\nbody","tags":["Go"],"category":"Go","status":"draft"}')"
ID=$(python3 -c "import json;d=json.load(open('/tmp/rpcbody'));d=d.get('json',d);print(d.get('id',''))" 2>/dev/null)
echo "  created post id=$ID"
chk "posts.update admin -> 200" 200 "$(rpc posts/update "$AD" "{\"id\":$ID,\"title\":\"Probe Post Edited\",\"slug\":\"zz-probe-post\",\"excerpt\":\"probe2\",\"content\":\"# probe\n\nedited\",\"tags\":[\"Go\"],\"category\":\"Go\",\"status\":\"draft\"}")"
chk "posts.setStatus publish -> 200" 200 "$(rpc posts/setStatus "$AD" "{\"id\":$ID,\"status\":\"published\"}")"
chk "published post visible publicly" 200 "$(rpc posts/bySlug '' '{"slug":"zz-probe-post"}')"
chk "posts.setStatus draft -> 200" 200 "$(rpc posts/setStatus "$AD" "{\"id\":$ID,\"status\":\"draft\"}")"
chk "draft hidden from public bySlug" 404 "$(rpc posts/bySlug '' '{"slug":"zz-probe-post"}')"
chk "posts.remove admin -> 200" 200 "$(rpc posts/remove "$AD" "{\"id\":$ID}")"
chk "deleted post gone" 404 "$(rpc posts/bySlug '' '{"slug":"zz-probe-post"}')"

echo
echo "passed=$pass failed=$fail"
[ "$fail" -eq 0 ]
