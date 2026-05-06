const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const ACCOUNT_COUNT = parseInt(process.env.ACCOUNTS || "1");

if (!ENDPOINT || !TOKEN) {
  console.error("ENDPOINT=host TOKEN=xxx ACCOUNTS=N node test-stream-drop.js");
  process.exit(1);
}

// Well-known Solana DEX pool/program accounts for testing
const KNOWN_ACCOUNTS = [
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",  // Orca Whirlpool
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",  // Meteora DLMM
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",  // PumpSwap
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",  // PumpFun
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",  // Serum DEX
  "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin", // Serum DEX v3
  "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1", // Orca Token Swap
  "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",  // Saber Stable Swap
];

async function main() {
  // Generate account list - use known accounts, then pad with deterministic pubkeys
  const accounts = [];
  for (let i = 0; i < ACCOUNT_COUNT; i++) {
    if (i < KNOWN_ACCOUNTS.length) {
      accounts.push(KNOWN_ACCOUNTS[i]);
    } else {
      // Use getSlot to find real accounts, or just use known ones repeated won't work
      // Instead use token mint addresses which are real accounts
      break;
    }
  }

  // If we need more accounts, fetch some from chain
  if (accounts.length < ACCOUNT_COUNT) {
    console.log(`Only have ${KNOWN_ACCOUNTS.length} known accounts, using those. Requested: ${ACCOUNT_COUNT}`);
  }

  const actualCount = accounts.length;
  console.log(`Testing with ${actualCount} accounts on ${ENDPOINT}...`);

  const client = new Client("https://" + ENDPOINT, TOKEN, {
    grpcMaxDecodingMessageSize: 64 * 1024 * 1024,
  });
  await client.connect();
  const stream = await client.subscribe();

  let msgCount = 0;
  let lastMsgTime = Date.now();
  const startTime = Date.now();

  // Check for silence every 5 seconds
  const checker = setInterval(() => {
    const silence = Date.now() - lastMsgTime;
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    if (silence > 5000) {
      console.log(`[${elapsed}s] SILENT for ${Math.round(silence / 1000)}s (${msgCount} msgs total)`);
    }
    if (silence > 30000) {
      console.log(`\n=== STREAM DEAD after ${msgCount} messages, silent for 30s ===`);
      console.log(`Elapsed: ${elapsed}s`);
      process.exit(1);
    }
  }, 5000);

  stream.on("data", (data) => {
    const now = Date.now();
    lastMsgTime = now;
    const elapsed = Math.round((now - startTime) / 1000);

    if (data.account) {
      msgCount++;
      if (msgCount <= 5 || msgCount % 50 === 0) {
        console.log(`[${elapsed}s] account update #${msgCount}`);
      }
    } else if (data.slot) {
      // Don't count slots as messages for the test
    } else if (data.ping) {
      // ping
    }

    if (elapsed >= 60) {
      clearInterval(checker);
      console.log(`\n=== STREAM ALIVE for 60s, ${msgCount} account updates ===`);
      process.exit(0);
    }
  });

  stream.on("error", (err) => {
    clearInterval(checker);
    console.error("Stream error:", err.message);
    process.exit(1);
  });

  const accountsFilter = {};
  accountsFilter["test"] = {
    account: accounts,
    owner: [],
    filters: [],
  };

  await new Promise((res, rej) => {
    stream.write({
      accounts: accountsFilter,
      slots: { heartbeat: { filterByCommitment: true } },
      transactions: {},
      transactionsStatus: {},
      blocks: {},
      blocksMeta: {},
      entry: {},
      accountsDataSlice: [],
      commitment: 0,
    }, (err) => err ? rej(err) : res());
  });

  console.log("Subscribed. Watching for stream drops (60s test)...");
}

main().catch((err) => { console.error("Fatal:", err.message); process.exit(1); });
