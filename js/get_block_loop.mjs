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

// Read epochOffset from the command line
const offset = process.argv[2] || 0;

const epochOffset = parseInt(offset) * 432000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log(`RPC_URL: ${process.env.RPC_URL}`);
console.log (`Epoch Offset: ${offset}`);

while(true) {
  try {
    let slot = await connection.getSlot('finalized');
    // slot = slot - epochOffset;
    // console.log(slot);
    let startTimestamp = new Date().getTime();
    const block = await connection.getBlock(
      slot - epochOffset, 
      { 
        commitment: 'finalized', 
        maxSupportedTransactionVersion: 1 
      }
    );
    let endTimestamp = new Date().getTime();
    console.log(`${new Date().toISOString()}: Slot: ${slot} ms: ${endTimestamp - startTimestamp}`);
  } catch (error) {
    console.error(`${new Date().toISOString()}: ${error}`);
  }
  await sleep(2000);
}

// Get the latest finalized slot
// const slot = await connection.getSlot('finalized');
// console.log(slot);

// // Fetch the block for that slot
// const block = await connection.getBlock(
//   slot, 
//   { 
//     commitment: 'finalized', 
//     maxSupportedTransactionVersion: 1 
//   }
// );
// console.log(block.transactions.length);
