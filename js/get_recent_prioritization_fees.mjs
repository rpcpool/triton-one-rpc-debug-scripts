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

// show highest prioritizationFee in fees
const highestFee = fees.reduce((prev, current) => (prev.prioritizationFee > current.prioritizationFee) ? prev : current);
console.log(`Highest prioritization fee: ${highestFee.prioritizationFee}`);

// show average prioritizationFee in fees
const sum = fees.reduce((prev, current) => prev + current.prioritizationFee, 0);
const avg = sum / fees.length;
console.log(`Average prioritization fee: ${avg}`);

// show median prioritizationFee in fees
const sorted = fees.sort((a, b) => a.prioritizationFee - b.prioritizationFee);
const middle = Math.floor(sorted.length / 2);
const isEven = sorted.length % 2 === 0;
const median = isEven ? (sorted[middle].prioritizationFee + sorted[middle - 1].prioritizationFee) / 2 : sorted[middle].prioritizationFee;
console.log(`Median prioritization fee: ${median}`);

// show 90th percentile prioritizationFee in fees
const percentile = 90;
const percentileIndex = Math.floor(sorted.length * (percentile / 100));
const percentileFee = sorted[percentileIndex].prioritizationFee;
console.log(`${percentile}th percentile prioritization fee: ${percentileFee}`);