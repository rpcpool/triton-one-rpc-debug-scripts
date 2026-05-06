const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const PUMPFUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

if (!ENDPOINT || !TOKEN) {
  console.error("ENDPOINT=host:port TOKEN=xxx node test-latency.js");
  process.exit(1);
}

async function main() {
  const client = new Client("https://" + ENDPOINT, TOKEN, { grpcMaxDecodingMessageSize: 64 * 1024 * 1024 });
  await client.connect();
  const stream = await client.subscribe();

  const slotFirstSeen = {};
  const networkLags = [];
  const slotToTxLags = [];
  let txCount = 0;

  stream.on("data", (data) => {
    const nowMs = Date.now();

    let serverSendMs = null;
    if (data.createdAt) {
      serverSendMs = data.createdAt.getTime();
      networkLags.push(nowMs - serverSendMs);
    }

    if (data.slot) {
      const slot = Number(data.slot.slot);
      if (!slotFirstSeen[slot]) slotFirstSeen[slot] = nowMs;
      return;
    }

    if (!data.transaction) return;
    txCount++;
    const slot = Number(data.transaction.slot);
    const slotSeen = slotFirstSeen[slot];

    if (slotSeen) {
      slotToTxLags.push(nowMs - slotSeen);
    }

    const netLag = networkLags.length > 0 ? networkLags[networkLags.length - 1] : "?";
    const slotLag = slotSeen ? (nowMs - slotSeen) + "ms" : "(no slot update)";

    console.log(`[tx #${txCount}] slot=${slot} slot-to-tx=${slotLag} net=${netLag}ms`);

    if (txCount >= 30) {
      if (networkLags.length > 0) {
        const s = [...networkLags].sort((a, b) => a - b);
        const avg = Math.round(networkLags.reduce((a, b) => a + b) / networkLags.length);
        console.log(`\n=== Network lag / createdAt->receipt (n=${networkLags.length}) ===`);
        console.log(`avg=${avg}ms  min=${s[0]}ms  p50=${s[Math.floor(s.length * 0.5)]}ms  max=${s[s.length - 1]}ms`);
      }
      if (slotToTxLags.length > 0) {
        const s = [...slotToTxLags].sort((a, b) => a - b);
        const avg = Math.round(slotToTxLags.reduce((a, b) => a + b) / slotToTxLags.length);
        console.log(`\n=== Slot-first-seen to tx receipt (n=${slotToTxLags.length}) ===`);
        console.log(`avg=${avg}ms  min=${s[0]}ms  p50=${s[Math.floor(s.length * 0.5)]}ms  max=${s[s.length - 1]}ms`);
      }
      process.exit(0);
    }
  });

  stream.on("error", (err) => { console.error("Error:", err.message); process.exit(1); });

  await new Promise((res, rej) => {
    stream.write({
      accounts: {},
      slots: { s: {} },
      transactions: {
        pumps: { vote: false, failed: false, accountInclude: [PUMPFUN], accountExclude: [], accountRequired: [] }
      },
      transactionsStatus: {}, blocks: {}, blocksMeta: {}, entry: {}, accountsDataSlice: [], commitment: 0,
    }, (err) => err ? rej(err) : res());
  });

  console.log("Subscribed (processed + slots). Collecting 30 txs...");
  setTimeout(() => { console.log("Timeout"); process.exit(1); }, 60000);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
