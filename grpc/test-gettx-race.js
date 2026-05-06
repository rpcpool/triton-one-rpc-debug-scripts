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

  stream.on("data", async (data) => {
    if (!data.transaction) return;
    if (tested >= 20) return;

    const sig = bs58.encode(data.transaction.transaction.signature);
    const slot = Number(data.transaction.slot);
    const streamTime = Date.now();

    tested++;
    const testNum = tested;

    // Immediately call getTransaction
    try {
      const resp = await rpcCall("getTransaction", [sig, { commitment: "confirmed", encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }]);
      const rpcTime = Date.now();
      const elapsed = rpcTime - streamTime;
      const isNull = resp.result === null;

      if (isNull) nullCount++;

      console.log(`[${testNum}] slot=${slot} sig=${sig.slice(0, 20)}... getTransaction=${isNull ? "NULL" : "OK"} elapsed=${elapsed}ms`);
      results.push({ slot, isNull, elapsed });

      if (testNum >= 20) {
        console.log(`\n=== Results: ${nullCount}/20 returned null ===`);
        const nullResults = results.filter(r => r.isNull);
        const okResults = results.filter(r => !r.isNull);
        if (okResults.length > 0) {
          const avgOk = Math.round(okResults.reduce((a, b) => a + b.elapsed, 0) / okResults.length);
          console.log(`OK responses: avg=${avgOk}ms`);
        }
        if (nullResults.length > 0) {
          const avgNull = Math.round(nullResults.reduce((a, b) => a + b.elapsed, 0) / nullResults.length);
          console.log(`NULL responses: avg=${avgNull}ms`);
        }
        process.exit(0);
      }
    } catch (err) {
      console.log(`[${testNum}] slot=${slot} sig=${sig.slice(0, 20)}... ERROR: ${err.message}`);
    }
  });

  stream.on("error", (err) => { console.error("Stream error:", err.message); process.exit(1); });

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
      commitment: 1, // confirmed
    }, (err) => err ? rej(err) : res());
  });

  console.log("Subscribed to confirmed txs. Testing getTransaction race for 20 txs...");
  setTimeout(() => { console.log("Timeout"); process.exit(1); }, 60000);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
