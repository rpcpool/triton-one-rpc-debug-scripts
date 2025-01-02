// Run in a loop to get the current slot from RPC.

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.RPC_URL;

// getSlot for RPC endpoint. Run in a loop.
async function getSlot () {
  const connection = new web3.Connection(endpoint, 'processed');

  while (true) {
    try {
      let start_time = new Date();
      let slot = await connection.getSlot();
      let elapsed_time = new Date() - start_time;
      console.log(`${new Date().toISOString()}:  RPC slot update: ${slot} in ${elapsed_time}ms`);
    } catch (e) {
      console.log('\n', e, '\n');
    }
    // sleep for 200 milliseconds
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

getSlot();