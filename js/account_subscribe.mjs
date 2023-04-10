// This script will open a subscription for OpenBook SOL-USDC events and remain
// open. Output to the console will show the detail for each new update along
// with the elapsed time since the last slot. On error, the script will exit and 
// dump error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node account_subscribe.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');

// OpenBook | SOL-USDC
const account = '8CvwxZ9Db6XbLD46NZwwmVDZZRDy7eydFcAGkXKh9axa';

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  const pub_key = new web3.PublicKey(account);

  connection.onAccountChange(
    pub_key,
    function(accountInfo) {
      elapsed_time = new Date() - start_time;
      console.log(
        new Date().toISOString(), 
        JSON.stringify(accountInfo), 
        `${elapsed_time / 1000.0} sec.`,
        "\n"
      );
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
