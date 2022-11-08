// This script will run a getProgramAccounts query on the Serum V3 program ID. 
// Output to the console will show the number of records returned and the 
// elapsed time in milliseconds. On error, the script will exit and dump 
// error details to the console.
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
console.log(slot);

// Fetch the block for that slot
const block = await connection.getBlock(
  slot, 
  { 
    commitment: 'finalized', 
    maxSupportedTransactionVersion: 0 
  }
);
console.log(block.transactions.length);
