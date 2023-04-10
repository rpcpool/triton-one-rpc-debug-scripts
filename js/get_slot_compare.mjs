// Compares the highest slot for two RPC connections.
//
// Example Use:
// Provide RPC_URL & RPC_URL_COMPARE in your .env file.
//
// node get_slot_compare.js

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const endpoints = {
  'RPC': process.env.RPC_URL,
  'Comparison': process.env.RPC_URL_COMPARE
}

// getSlot for each endpoint.
async function getSlots () {
  let slots = {};
  const keys = Object.keys(endpoints);

  // Loop through endpoints and run getSlot
  const fetchSlots = keys.map(async (key) => {
    let endpoint = endpoints[key];
    slots[key] = 0;

    // Set up web3 client
    const connection = new web3.Connection(endpoint, 'confirmed');

    try {
      let start_time = new Date();
      let slot = await connection.getSlot();

      // Add the slot to the slots array
      slots[key] = slot;

      // Log the results
      let elapsed_time = new Date() - start_time;
      console.log('Checking:',endpoint,"\n",new Date().toISOString(), 'Slot:', slot, 'in', elapsed_time, "milliseconds\n");
    } catch (e) {
      console.log('\n', e, '\n');
    }
  }); // end fetchSlots

  // Wait for all fetchSlots to complete
  await Promise.all(fetchSlots);

  // Return the slots
  return slots;
}

// Compare the slots
async function compareSlots () {
  let slots = await getSlots();
  let keys = Object.keys(slots);
  let slot1 = slots[keys[0]];
  let slot2 = slots[keys[1]];

  if (slot1 === slot2) {
    console.log('Slots are equal.');
  } else {
    console.log('Slots are not equal.');
  }
}

compareSlots();
