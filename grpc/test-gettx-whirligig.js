const WebSocket = require("ws");
const https = require("https");

const GRPC_ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;

if (!GRPC_ENDPOINT || !TOKEN) {
  console.error("Usage: ENDPOINT=host TOKEN=xxx node test-gettx-whirligig.js");
  process.exit(1);
}

const WS_URL = `wss://${GRPC_ENDPOINT}/${TOKEN}/whirligig`;
const RPC_URL = `https://${GRPC_ENDPOINT}/${TOKEN}`;

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const url = new URL(RPC_URL);
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const ws = new WebSocket(WS_URL);

  let tested = 0;
  let nullCount = 0;
  const results = [];
  const pending = [];

  ws.on("open", () => {
    console.log("WebSocket connected to Whirligig");

    // Subscribe to blocks like the customer does
    ws.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "blockSubscribe",
      params: [
        "all",
        {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
          transactionDetails: "signatures",
          showRewards: false,
        },
      ],
    }));
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);

    // Skip subscription confirmation
    if (msg.result !== undefined && !msg.method) return;

    if (msg.method !== "blockNotification") return;

    const block = msg.params?.result?.value?.block;
    if (!block || !block.signatures || block.signatures.length === 0) return;

    const slot = msg.params.result.value.slot || msg.params.result.context?.slot;

    // Pick up to 3 signatures from this block to test
    const sigs = block.signatures.slice(0, 3);

    for (const sig of sigs) {
      if (tested >= 30) return;
      tested++;
      const testNum = tested;
      const streamTime = Date.now();

      const p = rpcCall("getTransaction", [sig, { commitment: "confirmed", encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }])
        .then((resp) => {
          const elapsed = Date.now() - streamTime;
          const isNull = resp.result === null;
          if (isNull) nullCount++;
          console.log(`[${testNum}] slot=${slot} sig=${sig.slice(0, 20)}... ${isNull ? "NULL" : "OK"} ${elapsed}ms`);
          results.push({ slot, isNull, elapsed, sig });
        })
        .catch((err) => {
          console.log(`[${testNum}] ERROR: ${err.message}`);
        });
      pending.push(p);
    }

    if (tested >= 30) {
      Promise.all(pending).then(() => {
        console.log(`\n=== Results: ${nullCount}/30 returned null ===`);
        if (results.length > 0) {
          const nullR = results.filter(r => r.isNull);
          const okR = results.filter(r => !r.isNull);
          if (okR.length > 0) console.log(`OK: ${okR.length}, avg=${Math.round(okR.reduce((a, b) => a + b.elapsed, 0) / okR.length)}ms`);
          if (nullR.length > 0) {
            console.log(`NULL: ${nullR.length}, avg=${Math.round(nullR.reduce((a, b) => a + b.elapsed, 0) / nullR.length)}ms`);
            nullR.forEach(r => console.log(`  NULL sig=${r.sig.slice(0, 30)}... slot=${r.slot}`));
          }
        }
        process.exit(0);
      });
    }
  });

  ws.on("error", (err) => { console.error("WS error:", err.message); process.exit(1); });
  ws.on("close", () => { console.log("WS closed"); process.exit(1); });

  console.log(`Connecting to ${WS_URL}...`);
  setTimeout(() => { console.log("Timeout"); process.exit(1); }, 120000);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
