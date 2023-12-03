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

const account_state_votes = {};

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

  // console.log(`${JSON.stringify(tx)}\n`);
  // console.log(`${JSON.stringify(tx.transaction.message.instructions[0].parsed)}\n`);
  const lockout_length = tx.transaction.message.instructions[0].parsed.info.voteStateUpdate.lockouts.length;
  const vote_slot = tx.transaction.message.instructions[0].parsed.info.voteStateUpdate.lockouts[lockout_length-1].slot;
  const vote_state_hash = tx.transaction.message.instructions[0].parsed.info.voteStateUpdate.hash;
  if(!account_state_votes[vote_state_hash]) {
    account_state_votes[vote_state_hash] = 0;
  }
  account_state_votes[vote_state_hash] = account_state_votes[vote_state_hash] + 1;

  const output = [
    tx.transaction.message.instructions[0].parsed.info.voteStateUpdate.root,
    vote_slot,
    vote_slot - slot_number,
    vote_state_hash,
    tx.transaction.message.instructions[0].parsed.info.voteAuthority,
    tx.transaction.signatures[0]
  ]
  console.log(`${JSON.stringify(output)}`);

});
console.log(account_state_votes);