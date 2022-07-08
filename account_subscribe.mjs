// This script will open a subscription for Serum SOL-USDC updates and remain
// open. Output to the console will show the detail for each new update along
// with the elapsed time since the last slot. On error, the script will exit and 
// dump error details to the console.
//
// Change rpc_endpoint below to check your connection.
//
// Example Use:
// node account_subscribe.mjs

import * as web3 from '@solana/web3.js';

// Set up web3 client
const rpc_endpoint = 'https://api.mainnet-beta.solana.com';
const commitmentLevel = 'confirmed';
const connection = new web3.Connection(rpc_endpoint, commitmentLevel);

// Serum | SOL-USDC
const account = '9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT';

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  const pub_key = new web3.PublicKey(account);

  connection.onAccountChange(pub_key,
    function(accountInfo) {
      elapsed_time = new Date() - start_time;
      console.log(new Date().toISOString(), accountInfo, `${elapsed_time / 1000.0} sec.`);
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
