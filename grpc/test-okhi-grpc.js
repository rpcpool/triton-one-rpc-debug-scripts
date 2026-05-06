/**
 * Ok Hi gRPC repro test
 * Tests if subscribing to WSOL mint + slots works with and without ping in initial request
 *
 * Usage:
 *   ENDPOINT=your-endpoint.mainnet.rpcpool.com TOKEN=xxx node test-okhi-grpc.js
 */
const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;

if (!ENDPOINT || !TOKEN) {
  console.error("Usage: ENDPOINT=xxx TOKEN=xxx node test-okhi-grpc.js");
  process.exit(1);
}

const WSOL_MINT = "So11111111111111111111111111111111111111112";

function ts() { return new Date().toISOString(); }

async function test(label, includePingInRequest) {
  console.log(`\n[${ts()}] === TEST: ${label} ===`);
  console.log(`[${ts()}] Ping in initial request: ${includePingInRequest}`);

  const client = new Client("https://" + ENDPOINT, TOKEN, {
    grpcMaxDecodingMessageSize: 64 * 1024 * 1024,
  });

  const stream = await client.subscribe();

  let pingCount = 0;
  let slotCount = 0;
  let accountCount = 0;

  stream.on("data", (data) => {
    if (data.pong) { pingCount++; console.log(`[${ts()}] PONG #${pingCount}`); }
    else if (data.slot) { slotCount++; if (slotCount <= 3) console.log(`[${ts()}] SLOT: ${data.slot.slot}`); }
    else if (data.account) { accountCount++; console.log(`[${ts()}] ACCOUNT UPDATE: ${data.account.account?.pubkey}`); }
    else { console.log(`[${ts()}] OTHER:`, Object.keys(data).filter(k => data[k])); }
  });

  stream.on("error", (err) => console.error(`[${ts()}] ERROR: ${err.message}`));

  const request = {
    slots: { all_slots: { filterByCommitment: false } },
    accounts: {
      wsol_test: {
        account: [WSOL_MINT],
        owner: [],
        filters: [],
        nonemptyTxnSignature: false,
      }
    },
    commitment: 0, // PROCESSED
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
    accountsDataSlice: [],
  };

  // The key difference — include ping or not
  if (includePingInRequest) {
    request.ping = { id: 1 };
  }

  await new Promise((resolve, reject) => {
    stream.write(request, (err) => err ? reject(err) : resolve());
  });

  console.log(`[${ts()}] Subscribe request sent, waiting 20s...`);

  await new Promise(resolve => setTimeout(resolve, 20000));

  console.log(`\n[${ts()}] === RESULTS for "${label}" ===`);
  console.log(`  Pongs:    ${pingCount}`);
  console.log(`  Slots:    ${slotCount}`);
  console.log(`  Accounts: ${accountCount}`);

  stream.end();
  return { pingCount, slotCount, accountCount };
}

async function main() {
  // Test 1: WITH ping in initial request (customer's code)
  const withPing = await test("WITH ping in initial request (customer's code)", true);

  // Test 2: WITHOUT ping in initial request
  const withoutPing = await test("WITHOUT ping in initial request", false);

  console.log("\n=== COMPARISON ===");
  console.log("With ping:   ", withPing);
  console.log("Without ping:", withoutPing);

  if (withPing.slotCount === 0 && withoutPing.slotCount > 0) {
    console.log("\n>>> CODE BUG: ping in initial request suppresses data");
  } else if (withPing.slotCount === 0 && withoutPing.slotCount === 0) {
    console.log("\n>>> INFRA ISSUE: no data regardless of ping");
  } else {
    console.log("\n>>> Both work fine");
  }

  process.exit(0);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
