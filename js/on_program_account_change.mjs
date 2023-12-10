// This script will open a subscription for a given program and remain
// open. Output to the console will show the detail for each new update along
// with the elapsed time since the last slot. On error, the script will exit and 
// dump error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node on_program_account_change.mjs PROGRAM_ID <optional boolean. true for verbose output>

import crypto from 'crypto';
import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'processed');

// OpenBook | SOL-USDC event queue
const program = process.argv[2];
const verbose = process.argv[3];

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  const pub_key = new web3.PublicKey(program);

  connection.onProgramAccountChange(
    pub_key,
    function(accountInfo) {
      elapsed_time = new Date() - start_time;
      if (verbose) {
        console.log(
          new Date().toISOString(), 
          JSON.stringify(accountInfo), 
          `${elapsed_time / 1000.0} sec.`,
          "\n"
        );
      } else {
        // calculate sha256 hash of the account data
        const hash = crypto.createHash('sha256');
        hash.update(accountInfo.accountInfo.data);
        const hash_hex = hash.digest('hex');

        console.log(
          new Date().toISOString(), 
          accountInfo.accountId.toBase58(),
          hash_hex,
          // accountInfo.accountInfo.lamports,
          // accountInfo.accountInfo.space,
          `${elapsed_time / 1000.0} sec.`,
        );
      }
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
