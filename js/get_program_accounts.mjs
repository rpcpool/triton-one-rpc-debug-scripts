// This script will run a getProgramAccounts query on the Serum V3 program ID. 
// Output to the console will show the number of records returned and the 
// elapsed time in milliseconds. On error, the script will exit and dump 
// error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_program_accounts.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');

// Setup getProgramAccounts call
//
// Serum
// const program_id = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'; // Program
// const gpa_owner_id = 'FnJZCfHc6LuZKCWMJGsHmpmqPeVVpxiJR3upiFp8TWsG'; // Filter
// const data_size = 3228;
// const offset = 45;
//
// Tokenkeg
const program_id = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'; // Program
const gpa_owner_id = 'CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf'; // Filter
const data_size = 165;
const offset = 32;

console.log('Checking:',process.env.RPC_URL,"\n");

try {
  let start_time = new Date();
  const program_key = new web3.PublicKey(program_id);

  const accounts = await connection.getProgramAccounts(
    program_key,
    {
      filters: [
        { dataSize: data_size },
        { memcmp: { offset: offset, bytes: gpa_owner_id } }
      ]
    }
  );

  let elapsed_time = new Date() - start_time;
  console.log(accounts.length, 'accounts in', elapsed_time, "milliseconds\n");
  console.log(JSON.stringify(accounts));
  console.log(accounts.length, 'accounts in', elapsed_time, "milliseconds\n");
} catch (e) {
  console.log('\n', e, '\n');
}
