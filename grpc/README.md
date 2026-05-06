# gRPC Debug Scripts

Yellowstone gRPC diagnostic scripts for investigating Triton/Dragon's Mouth issues.

## Setup

```bash
npm install @triton-one/yellowstone-grpc bs58 ws
```

## Scripts

| Script | What it does | Run |
|---|---|---|
| `test-latency.js` | Measures gRPC round-trip latency (slot subscription ping) | `ENDPOINT=host TOKEN=xxx node test-latency.js` |
| `test-slot-compare.js` | Compares a combined `accountInclude` stream against individual streams | `ENDPOINT=host TOKEN=xxx node test-slot-compare.js` |
| `test-ordering.js` | Checks per-slot transaction index arrival order and timing relative to `blockMeta` | `ENDPOINT=host TOKEN=xxx node test-ordering.js` |
| `test-stream-drop.js` | Detects silent stream drops on subscribeAccounts during write bursts | `ENDPOINT=host TOKEN=xxx ACCOUNTS=N node test-stream-drop.js` |
| `test-duplicates.js` | Detects duplicate transactions in the gRPC stream; `RECONNECT=1` tests across reconnects | `ENDPOINT=host TOKEN=xxx node test-duplicates.js` |
| `test-gettx-race.js` | Tests if getTransaction returns null immediately after seeing a tx in the stream (sequential) | `ENDPOINT=host TOKEN=xxx node test-gettx-race.js` |
| `test-gettx-race2.js` | Same as above but fires all getTransaction calls in parallel | `ENDPOINT=host TOKEN=xxx node test-gettx-race2.js` |
| `test-gettx-whirligig.js` | Same race test but using Whirligig WebSocket instead of gRPC stream | `ENDPOINT=host TOKEN=xxx node test-gettx-whirligig.js` |
| `test-okhi-grpc.js` | Tests whether including ping in the initial subscribe request suppresses data | `ENDPOINT=host TOKEN=xxx node test-okhi-grpc.js` |
| `test-h2-repro-flash.js` | Reproduces h2 protocol error caused by missing keepalive config; auto-exits after 30s by default — edit the script to remove the timeout for a full 2-3h run | `ENDPOINT=host TOKEN=xxx node test-h2-repro-flash.js` |
| `test-sdk.js` | Measures PumpFun vs PumpSwap transaction throughput via gRPC | `ENDPOINT=host TOKEN=xxx node test-sdk.js` |
