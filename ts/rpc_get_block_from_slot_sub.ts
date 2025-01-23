import { Connection } from "@solana/web3.js"

import dotenv from 'dotenv'
dotenv.config()

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com"

const COMMITMENT_LEVEL = "finalized"

console.log(`Using commitment level ${COMMITMENT_LEVEL}`);


async function main() {
  const connection = new Connection(RPC_ENDPOINT)

  while (true) {
    const slot = await connection.getSlot({ commitment: COMMITMENT_LEVEL })
    console.log(`${new Date().toUTCString()} Got Slot: ${slot}`)

    while (true) {
      const startTime = Date.now()
      let tries = 1;
      try {
        const block = await connection.getBlock(slot, { commitment: COMMITMENT_LEVEL, rewards: true, transactionDetails: "full", maxSupportedTransactionVersion: 0 })
        if (block != null) {
          console.log(`${new Date().toUTCString()} Got Block ${slot} in ${Date.now() - startTime}ms`);
          break;
        }
      } catch (e: any) {
        console.error(`${new Date().toUTCString()} Error fetching block ${slot}: ${e.message}`);
      }
    }
    // Sleep for 2.5 seconds to avoid hitting rate limits in this demo script
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

}
main()