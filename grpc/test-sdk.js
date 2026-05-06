const Client = require("@triton-one/yellowstone-grpc").default;
const bs58 = require("bs58").default || require("bs58");

const ENDPOINT = process.env.ENDPOINT;
const TOKEN = process.env.TOKEN;
const MODE = process.env.MODE || "both";
const USE_DEFLATE = process.env.DEFLATE === "1";
const USE_ADAPTIVE = process.env.ADAPTIVE === "1";

if (!ENDPOINT || !TOKEN) {
  console.error("ENDPOINT=host:port TOKEN=xxx [MODE=both|pumpfun|pumpswap] [DEFLATE=1] [ADAPTIVE=1] node test-sdk.js");
  process.exit(1);
}

const PUMPFUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const PUMPSWAP = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
const PUMPFUN_BYTES = Buffer.from(bs58.decode(PUMPFUN));
const PUMPSWAP_BYTES = Buffer.from(bs58.decode(PUMPSWAP));

async function main() {
  const channelOptions = { grpcMaxDecodingMessageSize: 64 * 1024 * 1024 };

  if (USE_DEFLATE) channelOptions.grpcDefaultCompressionAlgorithm = 1;
  if (USE_ADAPTIVE) channelOptions.grpcHttp2AdaptiveWindow = true;

  console.log(`SDK | Mode: ${MODE} | Endpoint: ${ENDPOINT} | deflate: ${USE_DEFLATE} | adaptive: ${USE_ADAPTIVE}`);

  const client = new Client("https://" + ENDPOINT, TOKEN, channelOptions);
  await client.connect();
  const stream = await client.subscribe();

  let pf = 0, ps = 0, both = 0, total = 0;
  const startTime = Date.now();

  stream.on("data", (data) => {
    if (!data.transaction) return;
    total++;
    const tx = data.transaction.transaction;
    if (tx) {
      let hasPf = false, hasPs = false;

      const keys = (tx.transaction?.message?.accountKeys) || [];
      for (const k of keys) {
        const buf = Buffer.from(k);
        if (buf.equals(PUMPFUN_BYTES)) hasPf = true;
        if (buf.equals(PUMPSWAP_BYTES)) hasPs = true;
      }

      const meta = tx.meta;
      if (meta) {
        for (const k of [...(meta.loadedWritableAddresses || []), ...(meta.loadedReadonlyAddresses || [])]) {
          const buf = Buffer.from(k);
          if (buf.equals(PUMPFUN_BYTES)) hasPf = true;
          if (buf.equals(PUMPSWAP_BYTES)) hasPs = true;
        }
      }

      if (hasPf && hasPs) both++;
      else if (hasPf) pf++;
      else if (hasPs) ps++;
    }

    if (total % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${elapsed}s] total=${total} pf=${pf} ps=${ps} both=${both} rate=${(total / parseFloat(elapsed)).toFixed(1)}/s`);
    }
  });

  stream.on("error", (err) => { console.error("Error:", err.message); printSummary(); });
  stream.on("end", printSummary);

  function printSummary() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const matched = pf + ps + both;
    console.log(`\n=== ${elapsed}s ===`);
    console.log(`Total: ${total} | PumpFun: ${pf} | PumpSwap: ${ps} | Both: ${both} | Unmatched: ${total - matched}`);
    console.log(`Rate: ${(total / parseFloat(elapsed)).toFixed(1)} tx/s`);
  }

  let accountInclude = [];
  if (MODE === "both") accountInclude = [PUMPFUN, PUMPSWAP];
  else if (MODE === "pumpfun") accountInclude = [PUMPFUN];
  else if (MODE === "pumpswap") accountInclude = [PUMPSWAP];

  await new Promise((resolve, reject) => {
    stream.write({
      accounts: {}, slots: {}, transactions: {
        pumps: { vote: false, failed: false, accountInclude, accountExclude: [], accountRequired: [] }
      }, transactionsStatus: {}, blocks: {}, blocksMeta: {}, entry: {}, accountsDataSlice: [], commitment: 0,
    }, (err) => err ? reject(err) : resolve());
  });

  setTimeout(() => { printSummary(); process.exit(0); }, 60000);
  process.on("SIGINT", () => { printSummary(); process.exit(0); });
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
