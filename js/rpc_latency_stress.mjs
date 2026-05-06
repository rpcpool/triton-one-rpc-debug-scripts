import https from 'https';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.RPC_URL;
const METHOD = process.env.METHOD || "getSlot";
let PARAMS = [{ commitment: "confirmed" }];
if (process.env.PARAMS) {
  try { PARAMS = JSON.parse(process.env.PARAMS); }
  catch { process.stderr.write("Invalid PARAMS: must be valid JSON.\n"); process.exit(1); }
}
const N = parseInt(process.env.N || "200");
const BATCH = parseInt(process.env.BATCH || "10");

if (!RPC_URL) {
  process.stderr.write("RPC_URL=https://... [METHOD=getSlot] [N=200] [BATCH=10] node rpc_latency_stress.mjs\n");
  process.exit(1);
}

function call(id) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id, method: METHOD, params: PARAMS });
    const url = new URL(RPC_URL);
    const transport = url.protocol === "http:" ? http : https;
    const t = Date.now();
    const req = transport.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === "http:" ? 80 : 443),
      path: url.pathname + url.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      res.resume();
      res.on("end", () => {
        const elapsed = Date.now() - t;
        const status = res.statusCode ?? 0;
        if (status >= 200 && status < 300) resolve({ elapsed, status });
        else resolve({ elapsed, status, error: `http ${status}` });
      });
    });
    req.on("error", (e) => resolve({ elapsed: Date.now() - t, error: e.message }));
    req.setTimeout(30000, () => { req.destroy(); resolve({ elapsed: Date.now() - t, error: "timeout" }); });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`${METHOD} × ${N} (batch=${BATCH})`);
  const results = [];

  for (let b = 0; b < Math.ceil(N / BATCH); b++) {
    const size = Math.min(BATCH, N - b * BATCH);
    const batch = await Promise.all(Array.from({ length: size }, (_, i) => call(b * BATCH + i + 1)));
    results.push(...batch);
    const max = Math.max(...batch.map((r) => r.elapsed));
    process.stdout.write(max > 5000 ? ` [SLOW ${max}ms] ` : ".");
  }

  const times = results.filter((r) => !r.error).map((r) => r.elapsed).sort((a, b) => a - b);

  if (times.length === 0) {
    console.log(`\n\nall ${results.length} requests failed`);
    process.exit(1);
  }

  const p = (n) => {
    const idx = Math.min(times.length - 1, Math.max(0, Math.ceil(times.length * n) - 1));
    return times[idx] ?? 0;
  };
  console.log(`\n\nN=${times.length} min=${times[0]}ms p50=${p(0.5)}ms p90=${p(0.9)}ms p95=${p(0.95)}ms p99=${p(0.99)}ms max=${times[times.length - 1]}ms`);

  const slow = results.filter((r) => r.elapsed > 5000);
  if (slow.length) console.log(`slow (>5s): ${slow.length}`);
  const errors = results.filter((r) => r.error);
  if (errors.length) console.log(`errors: ${errors.length}`);
}

main();

// Usage: RPC_URL=https://your.endpoint/token METHOD=getTokenAccountsByOwner PARAMS='["owner_pubkey",{"programId":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},{"encoding":"base64"}]' N=200 BATCH=10 node rpc_latency_stress.mjs
// OneBalance (Jan 2026) — intermittent high latency spikes on getTokenAccountsByOwner; use to find p99 and spot slow outliers
