// This script will run a getBlock and print out details for the vote transactions
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_block.mjs <slot-number>

import * as web3 from '@solana/web3.js';
// import { serialize, deserialize, deserializeUnchecked } from "borsh";
// import { Buffer } from "buffer";
import dotenv from 'dotenv';
dotenv.config();

// Read the slot number from the command line
const slot = process.argv[2];
if(!slot) {throw new Error('Please provide a slot number')};
const slot_number = parseInt(slot);

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'confirmed'
);

const block = await connection._rpcRequest(
  'getBlock',
  connection._buildArgsAtLeastConfirmed(
    [slot_number],
    'confirmed',
    'jsonParsed',
    {
      maxSupportedTransactionVersion: 1
    }
  )
)

console.log(block.result.transactions.length);

block.result.transactions.forEach((tx) => {
  // create a new PublicKey object for the Vote program ID
  const vp = new web3.PublicKey('Vote111111111111111111111111111111111111111');

  // Loop to the next tx unless tx.transaction.message.accountKeys exists
  if(!tx.transaction.message.accountKeys) return;

  // Loop to the next tx unless accountKeys includes 'Vote111111111111111111111111111111111111111'
  if(!tx.transaction.message.accountKeys.find((key) => key.pubkey == "Vote111111111111111111111111111111111111111")) return;

  console.log(`${JSON.stringify(tx)}\n`);
  console.log(`${JSON.stringify(tx.transaction.message.instructions[0].parsed)}\n`);

  // TODO: Parse the instruction data

});
