// This script will open a subscription for slot updates and remain open. 
// Output to the console will show the detail for each new slot along with the
// elapsed time since the last slot. On error, the script will exit and dump 
// error details to the console.
//
// Change `rpc_endpoint` below to check your connection.
//
// Example Use:
// node slot_subscribe.mjs

import * as web3 from '@solana/web3.js';

// Set up web3 client
const rpc_endpoint = 'https://api.mainnet-beta.solana.com';
const commitmentLevel = 'confirmed';
const connection = new web3.Connection(rpc_endpoint, commitmentLevel);

try {
  let start_time = new Date();
  let elapsed_time = new Date();
  connection.onSlotChange(
    function(slotInfo) {
      elapsed_time = new Date() - start_time;
      console.log(new Date().toISOString(), slotInfo, `${elapsed_time / 1000.0} sec.`);
      start_time = new Date();
    }
  );  
} catch (e) {
  console.log('\n', e, '\n');
}
