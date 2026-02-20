# gRPC Debug Scripts

Transaction streaming throughput tests for Yellowstone gRPC (Geyser). Currently focused on PumpFun vs PumpSwap traffic.

## Setup

```bash
npm install @triton-one/yellowstone-grpc @grpc/grpc-js @grpc/proto-loader bs58
```

## Usage

```bash
ENDPOINT=host:port TOKEN=xxx node test-sdk.js
ENDPOINT=host:port TOKEN=xxx MODE=pumpswap ZSTD=1 node test-sdk.js
ENDPOINT=host:port TOKEN=xxx PROTO_PATH=/path/to/proto ./test-grpcurl.sh
```

## Scripts

- `test-sdk.js` — yellowstone SDK, PumpFun/PumpSwap breakdown, compression + window options
- `test-grpcurl.sh` — grpcurl shell wrapper

## Env vars

- `ENDPOINT` (required) — gRPC host:port
- `TOKEN` (required) — x-token auth
- `MODE` — `both` (default), `pumpfun`, `pumpswap`
- `ZSTD=1` — enable compression
- `ADAPTIVE=1` — adaptive HTTP/2 window
- `DURATION=n` — test seconds (grpcurl, default 60)
- `PROTO_PATH` — path to geyser.proto
