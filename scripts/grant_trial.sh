#!/bin/bash
EMAIL=$1
DAYS=${2:-30}
KEY="${SUPABASE_SERVICE_KEY}"
BASE="https://ckttttvgvpvflgjzkbmy.supabase.co"
if [ -z "$EMAIL" ]; then echo "Usage: SUPABASE_SERVICE_KEY=xxx bash scripts/grant_trial.sh email [days]"; exit 1; fi
if [ -z "$KEY" ]; then echo "Set SUPABASE_SERVICE_KEY env var first"; exit 1; fi
USER_ID=$(curl -sk "$BASE/auth/v1/admin/users" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | python3 -c "import sys,json;data=json.load(sys.stdin);[print(u['id']) for u in data['users'] if u['email']=='$EMAIL']")
if [ -z "$USER_ID" ]; then echo "User not found: $EMAIL"; exit 1; fi
EXPIRES=$(python3 -c "from datetime import datetime,timedelta,timezone;print((datetime.now(timezone.utc)+timedelta(days=$DAYS)).strftime('%Y-%m-%dT%H:%M:%SZ'))")
curl -sk -X PATCH "$BASE/rest/v1/profiles?id=eq.$USER_ID" -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" -d "{\"pro_expires_at\": \"$EXPIRES\"}"
echo "Granted ${DAYS}-day trial to $EMAIL"
