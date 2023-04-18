// get account info for a given account.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_account_info.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const account = 'DukyuqzWpy1BQdG5pLarZzbW2Bxf4wQDNKayPenVBoXd';

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting account info for ${account}\n`);
try {
  const info = await connection.getAccountInfo(new web3.PublicKey(account));
  console.log(info);
} catch (e) {
  console.log('\n', e, '\n');
}
console.log('');
