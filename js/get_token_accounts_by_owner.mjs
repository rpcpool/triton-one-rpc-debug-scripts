// get the token accounts for a given owner account.
//
// Output to the console will show the difference between the results of the 
// RPC_URL and RPC_URL_COMPARE endpoints.
//
// Example Use:
// node get_token_account_accounts_by_owner.mjs OWNER_PUBLIC_KEY

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the owner account from the command line
const owner = new web3.PublicKey(process.argv[2]);
const tokenkeg = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// const account = 'DukyuqzWpy1BQdG5pLarZzbW2Bxf4wQDNKayPenVBoXd';

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting token accounts for owner ${owner}\n`);
try {
  let start_time = new Date();

  const accounts = await connection.getTokenAccountsByOwner(
    owner,
    { programId: tokenkeg }
  );

  let elapsed_time = new Date() - start_time;

  console.log(new Date().toISOString(), accounts.value.length, 'accounts in', elapsed_time, "milliseconds\n");
} catch (e) {
  console.log('\n', e, '\n');
}
console.log('');
