#!/bin/bash

ENDPOINT="${1:?Usage: $0 <endpoint> <token>}"
TOKEN="${2:?Usage: $0 <endpoint> <token>}"
BASE_URL="${BASE_URL:-https://${ENDPOINT}/${TOKEN}}"
CONCURRENCY=100
LOGFILE="blocktime-nulls-$(date +%Y%m%d-%H%M%S).log"

echo "endpoint: $ENDPOINT"
echo "concurrency: $CONCURRENCY sigs/round"
echo "logging nulls to: $LOGFILE"
echo "ctrl+c to stop"
echo ""

total=0; round=0

check_sig() {
  local sig="$1"
  local res
  res=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getTransaction\",\"params\":[\"${sig}\",{\"encoding\":\"jsonParsed\",\"commitment\":\"confirmed\",\"maxSupportedTransactionVersion\":0}]}")
  local bt
  bt=$(echo "$res" | jq -r '.result.blockTime')
  if [[ "$bt" == "null" || -z "$bt" ]]; then
    echo "NULL blockTime: $sig"
    { echo "---"; echo "time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"; echo "sig: $sig"; echo "$res" | jq '.'; } >> "$LOGFILE"
  fi
}

while true; do
  round=$((round + 1))

  slot=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getSlot","params":[{"commitment":"confirmed"}]}' | jq -r '.result')
  [[ -z "$slot" || "$slot" == "null" ]] && echo "r${round}: getSlot failed" && sleep 1 && continue

  for ((i = 0; i <= 5; i++)); do
    s=$((slot - i))
    block=$(curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" \
      -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"getBlock\",\"params\":[${s},{\"encoding\":\"json\",\"transactionDetails\":\"signatures\",\"commitment\":\"confirmed\",\"maxSupportedTransactionVersion\":0}]}")
    [[ -z "$(echo "$block" | jq -r '.error // empty')" ]] && slot=$s && break
  done

  if ! echo "$block" | jq -e '.error == null and (.result.signatures | type == "array")' >/dev/null 2>&1; then
    echo "r${round}: getBlock failed for slots ${slot}-$((slot - 5))"
    sleep 1
    continue
  fi

  sigs=$(echo "$block" | jq -r --argjson limit "$CONCURRENCY" '(.result.signatures // [])[:$limit][]')
  count=$(echo "$block" | jq -r --argjson limit "$CONCURRENCY" '(.result.signatures // [])[:$limit] | length')
  total=$((total + count))

  pids=()
  while IFS= read -r sig; do
    [[ -z "$sig" ]] && continue
    check_sig "$sig" &
    pids+=($!)
  done <<< "$sigs"
  for pid in "${pids[@]}"; do wait "$pid"; done

  nulls=$(grep -c '^---$' "$LOGFILE" 2>/dev/null || echo 0)
  echo "r${round} slot=${slot} checked=${count} total=${total} nulls=${nulls}"

  sleep 1
done

# Usage: ./check_blocktime_nulls.sh your-endpoint.rpcpool.com your-token-uuid
# Jump Trading (Feb 2026) — blocks occasionally returning null blockTime on getTransaction
