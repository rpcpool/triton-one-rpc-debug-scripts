// This script will run getTransaction and print out the details.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_transaction.mjs <signature>

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the signature from the command line
const sig = process.argv[2];
if(!sig) {throw new Error('Please provide a signature')};

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'confirmed'
);

console.log(sig);
// Fetch the transaction
const tx = await connection.getParsedTransaction(sig);

// Print the transaction to the console
console.log(JSON.stringify(tx));