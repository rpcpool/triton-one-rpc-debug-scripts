// Get compressed assets for the given owner.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_asset_by_owner.mjs <owner-account>

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplBubblegum } from '@metaplex-foundation/mpl-bubblegum'

// Guard against missing account param
if (!process.argv[2]) {
  console.log('Missing account param');
  process.exit(1);
}

// Read the account from command line params
const account = process.argv[2];

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
// Setup the DAS API connection
const umi = createUmi(process.env.RPC_URL).use(mplBubblegum());

console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting assets for ${account}\n`);
let nfts = [];
try {
  const umiPublicKey = new web3.PublicKey(account);
  nfts = await umi.rpc.getAssetsByOwner({owner: umiPublicKey});
} catch (e) {
  nfts = e.message;
  console.log('\n', e, '\n');
}
console.log(`NFTS: ${JSON.stringify(nfts)}`);
console.log('');
