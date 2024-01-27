// This script will getBlockTime for the latest processed slot and print the result to the console along with the current time. On error, the script will exit and dump error details to the console UTC time.
//

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const commitments = ['processed', 'confirmed', 'finalized'];

// Create an async function to Loop through each commitment level
async function getBlockTimes() {
  for (const commitment of commitments) {
    // Set up web3 client
    const connection = new web3.Connection(
      process.env.RPC_URL, commitment
    );

    // Get the latest finalized slot
    const slot = await connection.getSlot(commitment);

    // Fetch the blockTime for that slot
    const blockTime = await connection.getBlockTime(slot);
    // convert unix timestamp to UTC
    const blockTimeUTC = new Date(blockTime * 1000);
    // Get the current time in UTC
    const now = new Date();

    console.log(`Slot:         ${slot}`);
    console.log(`Commitment:   ${commitment}`)
    console.log(`Block time:   ${blockTimeUTC.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Difference:   ${now - blockTimeUTC} ms`);
    console.log('');
  };
}

getBlockTimes();

