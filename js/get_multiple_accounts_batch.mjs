// Copy get_multiple_accounts_batch.example.yml to get_multiple_accounts_batch.yml
//
// Put your list of account pubkeys into get_multiple_accounts_batch.yml with the following format:
// - pubkey-1
// - pubkey-2
//
// This script will run a getMultipleAccounts query on the list in batches of up to 100
// or as specified in the second CLI parameter.
// Output to the console will show the number of records returned and the 
// elapsed time in milliseconds. On error, the script will exit and dump 
// error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_multiple_accounts_batch.mjs get_multiple_accounts_batch.yml 100

import * as web3 from '@solana/web3.js';
import yaml from 'js-yaml';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const multiple_accounts = yaml.load(fs.readFileSync(process.argv[2], 'utf8'));
const BATCH_SIZE = process.argv[3] || 100;
const number_of_batches = Math.ceil(multiple_accounts.length / BATCH_SIZE);

// Check each account is a valid PublicKey
multiple_accounts.forEach((account) => {
  try {
    const pk = new web3.PublicKey(account);
  } catch (e) {
    console.log('Invalid account:', account);
    console.log(e);
    process.exit(1);
  }
});

// Convert multiple_accounts to an array of PublicKeys
const multiple_accounts_keys = multiple_accounts.map((account) => new web3.PublicKey(account));

// console.log(`${multiple_accounts_batch}`);
console.log('Total accounts:', multiple_accounts.length);
console.log('Batch size:', BATCH_SIZE);
console.log('Number of batches:', number_of_batches);

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');

console.log('Checking:',process.env.RPC_URL,"\n");

const public_KeyBatch = [];
try {
  // Loop through multiple_accounts_batch in batches of BATCH_SIZE
  for (let i = 0; i < number_of_batches; i++) {

    let start_time = new Date();
    const batch = multiple_accounts_keys.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
    const accounts = await connection.getMultipleAccountsInfo(
      batch
    );

    console.log('Batch:', i + 1, 'of', number_of_batches);
    // console.log('Total accounts:', accounts.length);
    // console.log('First account owner:', accounts[0].owner.toBase58(), ' bytes ', accounts[0].data.length);
    // console.log('Last account owner:', accounts[accounts.length - 1].owner.toBase58(), ' bytes ', accounts[0].data.length);
    // Calculate total bytes in all accounts
    let total_bytes = 0;
    accounts.forEach((account) => {
      total_bytes += account.data.length;
    });

    let elapsed_time = new Date() - start_time;
    console.log(new Date().toISOString(), accounts.length, 'accounts in', elapsed_time, "milliseconds", ' Total bytes: ', total_bytes, "\n");
  }
} catch (e) {
  console.log('\n', e, '\n');
}
