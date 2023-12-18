// This script will run a getEpochInfo. 
// Output to the console will show the JSON response.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_epoch_info.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'finalized'
);

// Get the latest finalized slot
const epoch_info = await connection.getEpochInfo(); // 'finalized'
console.log(epoch_info);

