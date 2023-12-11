// This script will run getRecentPrioritizationFees for a given account
// and print out the details.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_recent_prioritization_fees.mjs <account-pubkey>

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the signature from the command line
const account_string = process.argv[2];
if(!account_string) {throw new Error('Please provide an account pubkey')};

const account = new web3.PublicKey(account_string);

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'confirmed'
);

console.log(`${account.toBase58()}`);
// Fetch the transaction
const fees = await connection.getRecentPrioritizationFees({lockedWritableAccounts: [account]});

// Loop through fees and print out the details
for (const fee of fees) {
  console.log(fee);
}
