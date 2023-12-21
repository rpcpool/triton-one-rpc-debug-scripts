// get the token account balance for a given token account.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_token_account_balance.mjs ACCOUNT_PUBKEY

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const account = process.argv[2];

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting token balance for ${account}\n`);
try {
  const balance = await connection.getTokenAccountBalance(new web3.PublicKey(account));
  console.log(balance);
} catch (e) {
  console.log('\n', e, '\n');
}
console.log('');
