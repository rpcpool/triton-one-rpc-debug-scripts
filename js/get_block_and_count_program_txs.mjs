// This script will run a getBlock query on the given program ID. 
// Output to the console will show the number of TXs for the program ID in the 
// block.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_block_and_count_program_txs.mjs <program-pubkey>

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const program_id = process.argv[2];
if(!program_id) {throw new Error('Please provide a program ID')}

// Set up web3 client
const connection = new web3.Connection(
  process.env.RPC_URL, 'finalized'
);
while (true) {
  let program_tx_count = 0;
  // Get the latest finalized slot
  const slot = await connection.getSlot('cnofirmed');
  // console.log(`Slot: ${slot}`);

  // Fetch the block for that slot
  const block = await connection._rpcRequest(
    'getBlock',
    connection._buildArgsAtLeastConfirmed(
      [slot],
      'confirmed',
      'jsonParsed',
      {
        maxSupportedTransactionVersion: 1
      }
    )
  )

  // Loop if block.result.transactions is undefined
  if(!block.result.transactions) continue;

  block.result.transactions.forEach((tx) => {
    // create a new PublicKey object for the Vote program ID
    const vp = new web3.PublicKey(program_id);

    // Loop to the next tx unless tx.transaction.message.accountKeys exists
    if(!tx.transaction.message.accountKeys) return;

    // Loop to the next tx unless accountKeys includes program_id
    if(!tx.transaction.message.accountKeys.find((key) => key.pubkey == program_id)) return;
    program_tx_count = program_tx_count + 1;
  });
  console.log(`${program_tx_count} of ${block.result.transactions.length} total TXs for program ${program_id} in slot ${slot}`);

  // sleep for 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));
}