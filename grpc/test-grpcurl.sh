#!/bin/bash
set -e

ENDPOINT="${ENDPOINT:?Set ENDPOINT=host:port}"
TOKEN="${TOKEN:?Set TOKEN=xxx}"
MODE="${MODE:-both}"
PROTO_PATH="${PROTO_PATH:-$(cd "$(dirname "$0")/../../yellowstone-grpc/yellowstone-grpc-proto/proto" && pwd)}"
DURATION="${DURATION:-60}"

PUMPFUN="6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
PUMPSWAP="pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA"

case "$MODE" in
  both)    INCLUDE="\"$PUMPFUN\", \"$PUMPSWAP\"" ;;
  pumpfun) INCLUDE="\"$PUMPFUN\"" ;;
  pumpswap) INCLUDE="\"$PUMPSWAP\"" ;;
esac

echo "grpcurl | Mode: $MODE | Endpoint: $ENDPOINT | Duration: ${DURATION}s"

REQUEST="{
  \"transactions\": {
    \"pumps\": {
      \"account_include\": [$INCLUDE],
      \"account_exclude\": [],
      \"account_required\": []
    }
  },
  \"accounts\": {},
  \"slots\": {},
  \"transactions_status\": {},
  \"blocks\": {},
  \"blocks_meta\": {},
  \"entry\": {},
  \"accounts_data_slice\": []
}"

grpcurl \
  -H "x-token: $TOKEN" \
  -import-path "$PROTO_PATH" \
  -proto geyser.proto \
  -d "$REQUEST" \
  "$ENDPOINT" \
  geyser.Geyser/Subscribe 2>/dev/null &

PID=$!
(sleep "$DURATION" && kill $PID 2>/dev/null) &
KILLER=$!
wait $PID 2>/dev/null
kill $KILLER 2>/dev/null
wait $KILLER 2>/dev/null
