// This script will fetch the most recent finalized block and 
// return the slot number, elapsed time, and transaction count.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_block.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'finalized'
);

// Get the latest finalized slot
const slot = await connection.getSlot('finalized');

let startTimestamp = new Date().getTime();
// Fetch the block for that slot
const block = await connection.getBlock(
  slot, 
  { 
    commitment: 'finalized', 
    maxSupportedTransactionVersion: 1 
  }
);
let endTimestamp = new Date().getTime();

console.log(`${new Date().toISOString()}: Slot: ${slot}, tx: ${block.transactions.length}, ms: ${endTimestamp - startTimestamp}`);