import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const RPC_URL = process.env.RPC_URL || process.argv[2];
const DELAY = parseInt(process.env.DELAY_MS || process.argv[3] || "0");

if (!RPC_URL) {
  process.stderr.write("RPC_URL=https://your.endpoint/token DELAY_MS=0 node check_block_availability.mjs\n");
  process.exit(1);
}

const WS_URL = RPC_URL.replace(/^https/, "wss").replace(/^http/, "ws");
const conn = new web3.Connection(RPC_URL, { commitment: "confirmed", wsEndpoint: WS_URL });

let ok = 0, missing = 0, other = 0;

conn.onSlotChange((info) => {
  const slot = info.slot;
  setTimeout(async () => {
    try {
      const block = await conn.getBlock(slot, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
      if (block) ok++;
      else other++;
    } catch (e) {
      if (e.message.includes("not available") || e.message.includes("32004")) missing++;
      else other++;
    }
  }, DELAY);
});

setInterval(() => {
  const total = ok + missing;
  const pct = total ? ((missing / total) * 100).toFixed(1) : "0.0";
  console.log(`ok=${ok} missing=${missing} (${pct}%) other=${other} delay=${DELAY}ms`);
}, 10000);

// Usage: RPC_URL=https://your.endpoint/token DELAY_MS=0 node check_block_availability.mjs
// CatTrading (Jan 2026) — getBlock returning -32004 immediately after slot notification; increase DELAY_MS to find safe threshold
