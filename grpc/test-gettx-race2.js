const Client = require("@triton-one/yellowstone-grpc").default;
const https = require("https");
const bs58 = require("bs58");

const GRPC_ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
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
  const client = new Client("https://" + GRPC_ENDPOINT, TOKEN, { grpcMaxDecodingMessageSize: 64 * 1024 * 1024 });
  await client.connect();
  const stream = await client.subscribe();

  let tested = 0;
  let nullCount = 0;
  const results = [];
  const pending = [];

  stream.on("data", (data) => {
    if (!data.transaction) return;
    if (tested >= 30) return;

    const sig = bs58.encode(data.transaction.transaction.signature);
    const slot = Number(data.transaction.slot);
    const streamTime = Date.now();

    tested++;
    const testNum = tested;

    // Immediately call getTransaction with confirmed commitment
    const p = rpcCall("getTransaction", [sig, { commitment: "confirmed", encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }])
      .then((resp) => {
        const elapsed = Date.now() - streamTime;
        const isNull = resp.result === null;
        if (isNull) nullCount++;
        console.log(`[${testNum}] slot=${slot} sig=${sig.slice(0, 16)}... ${isNull ? "NULL" : "OK"} ${elapsed}ms`);
        results.push({ slot, isNull, elapsed, sig });
      })
      .catch((err) => {
        console.log(`[${testNum}] ERROR: ${err.message}`);
      });
    pending.push(p);

    if (tested >= 30) {
      // Wait for all pending requests
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

  stream.on("error", (err) => { console.error("Stream error:", err.message); process.exit(1); });

  // Subscribe at PROCESSED level - txs arrive earlier
  await new Promise((res, rej) => {
    stream.write({
      accounts: {},
      slots: {},
      transactions: {
        all: { vote: false, failed: false, accountInclude: [], accountExclude: [], accountRequired: [] }
      },
      transactionsStatus: {},
      blocks: {},
      blocksMeta: {},
      entry: {},
      accountsDataSlice: [],
      commitment: 0, // processed
    }, (err) => err ? rej(err) : res());
  });

  console.log("Subscribed (PROCESSED stream, confirmed getTransaction). Testing 30 txs...");
  setTimeout(() => { console.log("Timeout"); process.exit(1); }, 120000);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
