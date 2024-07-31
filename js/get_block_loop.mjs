// This script will run getBlock for the latest finalized slot and print the result to the 
// console along with the current time.
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

    // Get the block five times in a row and print the time it takes to get the block
    
    for (let i = 0; i < 5; i++) {
      let startTimestamp = new Date().getTime();
      const block = await connection.getBlock(
        slot - epochOffset, 
        { 
          commitment: 'finalized', 
          maxSupportedTransactionVersion: 1 
        }
      );
      let endTimestamp = new Date().getTime();
      console.log(`${new Date().toISOString()}: Slot: ${slot}, tx: ${block.transactions.length}, ms: ${endTimestamp - startTimestamp}`);
    }
    console.log(''); // Add a newline between each block fetch
  } catch (error) {
    console.error(`${new Date().toISOString()}: ${error}`);
    console.log('');
  }
  await sleep(2000);
}

