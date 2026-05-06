const Client = require("@triton-one/yellowstone-grpc").default;

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const RECONNECT = process.env.RECONNECT === "1";
const SESSIONS = parseInt(process.env.SESSIONS || "5");
const SESSION_MS = parseInt(process.env.SESSION_MS || "15000");

if (!ENDPOINT || !TOKEN) {
  process.stderr.write("ENDPOINT and TOKEN required\n");
  process.exit(1);
}

const seen = new Map();
let totalTxs = 0;

async function runSession(id) {
  const client = new Client("https://" + ENDPOINT, TOKEN, undefined);
  const stream = await client.subscribe();

  stream.on("data", (data) => {
    if (!data.transaction) return;
    const sig = Buffer.from(data.transaction.transaction?.signature || []).toString("hex");
    const slot = data.transaction.slot?.toString();
    totalTxs++;

    if (seen.has(sig)) {
      const prev = seen.get(sig);
      prev.count++;
      const gap = Date.now() - prev.ts;
      console.log(`\nDUPLICATE sig=${sig.slice(0, 24)} slot=${slot} prev_slot=${prev.slot} gap=${gap}ms session=${id} count=${prev.count}`);
    } else {
      seen.set(sig, { ts: Date.now(), slot, session: id, count: 1 });
      if (totalTxs % 100 === 0) process.stdout.write(` [${totalTxs}]\n`);
      else process.stdout.write(".");
    }
  });

  stream.on("error", (err) => console.error(`\nsession ${id} error: ${err.message}`));

  await new Promise((res, rej) => stream.write({
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
    commitment: 1,
  }, (err) => err ? rej(err) : res()));

  return stream;
}

async function main() {
  if (RECONNECT) {
    for (let i = 1; i <= SESSIONS; i++) {
      console.log(`\n=== session ${i}/${SESSIONS} ===`);
      const stream = await runSession(i);
      await new Promise((r) => setTimeout(r, SESSION_MS));
      stream.destroy();
      if (i < SESSIONS) await new Promise((r) => setTimeout(r, 2000));
    }
    const dups = [...seen.values()].filter((v) => v.count > 1).length;
    console.log(`\ntotal=${totalTxs} unique=${seen.size} duplicates=${dups}`);
  } else {
    await runSession(1);
    await new Promise(() => {});
  }
}

main().catch((err) => { console.error(err.message); process.exit(1); });

// Usage: ENDPOINT=host TOKEN=xxx node test-duplicates.js
// RECONNECT=1 SESSIONS=5 SESSION_MS=15000 to test for duplicates across reconnects
// pump.fun (Jan 2026) — duplicate transactions appearing in gRPC stream after reconnect
