const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const PUMPFUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

if (!ENDPOINT || !TOKEN) {
  console.error("ENDPOINT=host:port TOKEN=xxx node test-ordering.js");
  process.exit(1);
}

async function main() {
  const client = new Client("https://" + ENDPOINT, TOKEN, { grpcMaxDecodingMessageSize: 64 * 1024 * 1024 });
  await client.connect();
  const stream = await client.subscribe();

  // Track per-slot: first tx time, last tx time, block meta time, tx indices
  const slotData = {};
  let slotsCompleted = 0;

  stream.on("data", (data) => {
    const nowMs = Date.now();

    if (data.blockMeta) {
      const slot = Number(data.blockMeta.slot);
      if (slotData[slot]) {
        slotData[slot].metaAt = nowMs;
        const d = slotData[slot];
        const metaDelay = d.metaAt - d.lastTxAt;
        const indices = d.indices.sort((a, b) => a - b);
        const outOfOrder = d.arrivalOrder.some((v, i, arr) => i > 0 && v < arr[i - 1]);
        console.log(`slot=${slot} txs=${d.count} meta_after_last_tx=${metaDelay}ms indices=[${indices.join(",")}] arrival_order=[${d.arrivalOrder.join(",")}] out_of_order=${outOfOrder}`);
        slotsCompleted++;
        if (slotsCompleted >= 10) {
          process.exit(0);
        }
      }
      return;
    }

    if (!data.transaction) return;
    const slot = Number(data.transaction.slot);
    const index = Number(data.transaction.transaction.index);

    if (!slotData[slot]) {
      slotData[slot] = { firstTxAt: nowMs, lastTxAt: nowMs, count: 0, indices: [], arrivalOrder: [] };
    }
    slotData[slot].lastTxAt = nowMs;
    slotData[slot].count++;
    slotData[slot].indices.push(index);
    slotData[slot].arrivalOrder.push(index);
  });

  stream.on("error", (err) => { console.error("Error:", err.message); process.exit(1); });

  await new Promise((res, rej) => {
    stream.write({
      accounts: {},
      slots: {},
      transactions: {
        pumps: { vote: false, failed: false, accountInclude: [PUMPFUN], accountExclude: [], accountRequired: [] }
      },
      transactionsStatus: {},
      blocks: {},
      blocksMeta: { meta: {} },
      entry: {},
      accountsDataSlice: [],
      commitment: 0,
    }, (err) => err ? rej(err) : res());
  });

  console.log("Subscribed (processed + blocksMeta + PumpFun txs). Collecting 10 slots...");
  setTimeout(() => { console.log("Timeout"); process.exit(1); }, 120000);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
