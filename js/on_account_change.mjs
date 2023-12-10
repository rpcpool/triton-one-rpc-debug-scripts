// This script will open a subscription for a given account and remain
// open. Output to the console will show the detail for each new update along
// with the elapsed time since the last slot. On error, the script will exit and 
// dump error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node on_account_change.mjs PROGRAM_ID <optional boolean. true for verbose output>

import crypto from 'crypto';
import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'proessed');

// OpenBook | SOL-USDC event queue
// '8CvwxZ9Db6XbLD46NZwwmVDZZRDy7eydFcAGkXKh9axa';
const account = process.argv[2];
const verbose = process.argv[3];

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  const pub_key = new web3.PublicKey(account);

  connection.onAccountChange(
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
        hash.update(accountInfo.data);
        const hash_hex = hash.digest('hex');
        
        console.log(
          new Date().toISOString(), 
          hash_hex,
          `${elapsed_time / 1000.0} sec.`,
        );
      }
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
