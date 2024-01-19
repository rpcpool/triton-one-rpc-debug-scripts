// get account info for a given account.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_account_info.mjs <account-pubkey>

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the account from the command line
const account = process.argv[2];
if (!account) {
  console.log('Please provide an account address');
  process.exit(1);
}

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting account info for ${account}\n`);
try {
  const info = await connection.getAccountInfo(
    new web3.PublicKey(account)
    );

  const vote_account = new web3.VoteAccount(info);
  console.log(vote_account);

  // Decode the base64 account data
  // const decoded_info = info.data.
  // console.log('Account Info:');
  // console.log('  Owner:', info.owner.toBase58());
  // console.log('  Lamports:', info.lamports);
  // console.log('  Data:', info.data.toJSON());
  console.log(web3.VoteAccount.fromAccountData(info.data));
  // console.log(JSON.stringify(decoded_info));
} catch (e) {
  console.log('\n', e, '\n');
}
console.log('');
