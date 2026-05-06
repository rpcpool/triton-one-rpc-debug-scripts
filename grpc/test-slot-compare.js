const Client = require("@triton-one/yellowstone-grpc").default;
const bs58 = require("bs58").default || require("bs58");

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const DURATION = parseInt(process.env.DURATION || "30") * 1000;

if (!ENDPOINT || !TOKEN) {
  console.error("ENDPOINT=host:port TOKEN=xxx [DURATION=30] node test-slot-compare.js");
  process.exit(1);
}

const PUMPFUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMPSWAP = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

async function startStream(label, accountInclude) {
  const client = new Client("https://" + ENDPOINT, TOKEN, {
    grpcMaxDecodingMessageSize: 64 * 1024 * 1024,
  });
  await client.connect();
  const stream = await client.subscribe();

  const slotTxs = {};
  let count = 0;

  stream.on("data", (data) => {
    if (!data.transaction) return;
    const tx = data.transaction.transaction;
    if (!tx) return;
    const slot = Number(data.transaction.slot);
    const sig = bs58.encode(Buffer.from(tx.signature));
    if (!slotTxs[slot]) slotTxs[slot] = new Set();
    slotTxs[slot].add(sig);
    count++;
  });

  stream.on("error", (err) => console.error(`${label} error:`, err.message));

  await new Promise((res, rej) => {
    stream.write({
      accounts: {}, slots: {}, transactions: {
        pumps: { vote: false, failed: false, accountInclude, accountExclude: [], accountRequired: [] }
      }, transactionsStatus: {}, blocks: {}, blocksMeta: {}, entry: {}, accountsDataSlice: [], commitment: 0,
    }, (err) => err ? rej(err) : res());
  });

  return { label, stream, slotTxs, getCount: () => count };
}

async function main() {
  console.log(`Starting 3 parallel streams for ${DURATION / 1000}s...`);

  const [both, pfOnly, psOnly] = await Promise.all([
    startStream("both", [PUMPFUN, PUMPSWAP]),
    startStream("pumpfun", [PUMPFUN]),
    startStream("pumpswap", [PUMPSWAP]),
  ]);

  await new Promise(r => setTimeout(r, DURATION));

  both.stream.destroy();
  pfOnly.stream.destroy();
  psOnly.stream.destroy();

  await new Promise(r => setTimeout(r, 1000));

  console.log(`\nCollected: both=${both.getCount()} pumpfun=${pfOnly.getCount()} pumpswap=${psOnly.getCount()}`);

  const allSlots = new Set([
    ...Object.keys(both.slotTxs),
    ...Object.keys(pfOnly.slotTxs),
    ...Object.keys(psOnly.slotTxs),
  ]);
  const sortedSlots = [...allSlots].map(Number).sort((a, b) => a - b);

  // trim first and last 5 slots to avoid edge effects
  const trimmed = sortedSlots.slice(5, -5);
  console.log(`Comparing ${trimmed.length} slots (trimmed edges)\n`);

  let missingFromBoth = 0;
  let extraInBoth = 0;
  let matchedSlots = 0;
  let mismatchedSlots = 0;

  for (const slot of trimmed) {
    const bSet = both.slotTxs[slot] || new Set();
    const pfSet = pfOnly.slotTxs[slot] || new Set();
    const psSet = psOnly.slotTxs[slot] || new Set();

    const individualUnion = new Set([...pfSet, ...psSet]);

    let slotMissing = 0;
    let slotExtra = 0;

    for (const sig of individualUnion) {
      if (!bSet.has(sig)) {
        slotMissing++;
        missingFromBoth++;
      }
    }

    for (const sig of bSet) {
      if (!individualUnion.has(sig)) {
        slotExtra++;
        extraInBoth++;
      }
    }

    if (slotMissing > 0 || slotExtra > 0) {
      mismatchedSlots++;
      if (mismatchedSlots <= 10) {
        console.log(`Slot ${slot}: both=${bSet.size} individual=${individualUnion.size} missing=${slotMissing} extra=${slotExtra}`);
      }
    } else {
      matchedSlots++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Slots compared: ${trimmed.length}`);
  console.log(`Matched: ${matchedSlots} | Mismatched: ${mismatchedSlots}`);
  console.log(`Sigs missing from combined: ${missingFromBoth}`);
  console.log(`Sigs extra in combined: ${extraInBoth}`);

  process.exit(0);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
