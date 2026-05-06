/**
 * Reproduction script for Flash h2 protocol error.
 *
 * Mimics Frost/Flash's client config: grpcMaxDecodingMessageSize only, NO keepalive.
 * Subscribes to slot updates and logs every event + any errors with timestamps.
 *
 * Expected: after ~2-3 hours the connection should die with:
 *   h2 protocol error: error reading a body from connection
 *   hyper::Error(Body, Error { kind: Io(Kind(ConnectionReset)) })
 *
 * Usage:
 *   ENDPOINT=your-endpoint.devnet.rpcpool.com TOKEN=your-token-uuid node test-h2-repro-flash.js
 */

const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;

if (!ENDPOINT || !TOKEN) {
  console.error("Usage: ENDPOINT=host TOKEN=xxx node test-h2-repro-flash.js");
  process.exit(1);
}

async function main() {
  // ===== Config A: NO keepalive (reproducing Flash/Frost's broken config) =====
  const channelOptions = {
    grpcMaxDecodingMessageSize: 64 * 1024 * 1024, // 64MiB — same as Frost's code
    // NOTE: No keepalive settings — this is the suspected root cause
  };

  console.log(`[${ts()}] === Flash h2 Protocol Error Reproduction ===`);
  console.log(`[${ts()}] Endpoint: ${ENDPOINT}`);
  console.log(`[${ts()}] Keepalive: DISABLED (reproducing customer config)`);
  console.log(`[${ts()}] Expecting h2 error after ~2-3 hours of idle timeout cycles\n`);

  const client = new Client("https://" + ENDPOINT, TOKEN, channelOptions);
  console.log(`[${ts()}] Client created`);

  const stream = await client.subscribe();
  console.log(`[${ts()}] Subscribed OK`);

  let slotCount = 0;
  let lastSlot = 0;
  let lastLogTime = Date.now();

  stream.on("data", (data) => {
    if (data.slot) {
      slotCount++;
      lastSlot = data.slot.slot;
      // Log every 30 seconds instead of every slot to avoid noise
      if (Date.now() - lastLogTime > 30000) {
        console.log(`[${ts()}] ALIVE | slots received: ${slotCount} | latest: ${lastSlot}`);
        lastLogTime = Date.now();
      }
    } else if (data.pong) {
      console.log(`[${ts()}] PONG received`);
    }
  });

  stream.on("error", (err) => {
    console.error(`\n[${ts()}] *** ERROR CAUGHT ***`);
    console.error(`[${ts()}] Message: ${err.message}`);
    console.error(`[${ts()}] Code: ${err.code}`);
    console.error(`[${ts()}] Details: ${err.details || "none"}`);
    console.error(`[${ts()}] Total slots before error: ${slotCount}`);
    console.error(`[${ts()}] Last slot: ${lastSlot}`);
    process.exit(1);
  });

  stream.on("end", () => {
    console.log(`[${ts()}] Stream ended. Slots received: ${slotCount}`);
    process.exit(0);
  });

  // Send subscribe request — slot updates only
  await new Promise((resolve, reject) => {
    stream.write({
      slots: { slot: { filterByCommitment: true } },
      commitment: 0, // PROCESSED
      accounts: {},
      accountsDataSlice: [],
      transactions: {},
      transactionsStatus: {},
      blocks: {},
      blocksMeta: {},
      entry: {},
    }, (err) => err ? reject(err) : resolve());
  });

  console.log(`[${ts()}] Subscribe request sent — waiting for data...\n`);

  // Auto-exit after 30s for quick test (remove for long-running repro)
  setTimeout(() => {
    console.log(`\n[${ts()}] === 30s test complete ===`);
    console.log(`[${ts()}] Slots received: ${slotCount} | Last slot: ${lastSlot}`);
    console.log(`[${ts()}] Connection stayed ALIVE during test window.`);
    console.log(`[${ts()}] NOTE: The h2 error takes ~2-3 hours to manifest. Run without timeout for full repro.`);
    process.exit(0);
  }, 30000);

  process.on("SIGINT", () => {
    console.log(`\n[${ts()}] Interrupted. Slots received: ${slotCount} | Last slot: ${lastSlot}`);
    process.exit(0);
  });
}

function ts() {
  return new Date().toISOString();
}

main().catch((err) => {
  console.error(`[${ts()}] FATAL: ${err.message}`);
  process.exit(1);
});
