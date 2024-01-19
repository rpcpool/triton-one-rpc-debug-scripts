// This script will open a subscription for slot updates and remain open. 
// For each new slot, the script will fetch the block for that slot.
// Output to the console will show the detail for each new slot along with the
// elapsed time since the last slot. On error, the script will exit and dump 
// error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node subscribe_blocks.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const PUBSUB_COMMITMENT_LEVEL = 'finalized';
const RPC_COMMITMENT_LEVEL = 'confirmed';
const pubsub_conn = new web3.Connection(process.env.RPC_URL, PUBSUB_COMMITMENT_LEVEL);
const rpc_conn = new web3.Connection(process.env.RPC_URL, RPC_COMMITMENT_LEVEL);

async function fetchBlock(slot) {
  try {
    const block = await rpc_conn.getBlock(
      slot, 
      { 
        commitment: RPC_COMMITMENT_LEVEL, 
        maxSupportedTransactionVersion: 1,
        transactionDetails: 'full' 
      }
    );
    // console.log(`${slot} => ${block.transactions.length}`);
    return block;
  } catch (e) {
    console.log('\n', e, '\n');
  }
}

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  pubsub_conn.onSlotChange(
    async function(slotInfo) {
      const slot = slotInfo.root; // slotInfo.slot is not available for download from RPC yet
      const block = await fetchBlock(slot);
      elapsed_time = new Date() - start_time;
      console.log(
          new Date().toISOString(), 
          slotInfo, 
          `${slot} => ${block.transactions.length} TXs`,
          `${elapsed_time / 1000.0} sec.`
      );
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
