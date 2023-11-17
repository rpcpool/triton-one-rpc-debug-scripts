// Get compressed assets for the given owner.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_assets_by_owner.mjs <owner-account>

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

// Load the endpoints to compare
const endpoints = {
  'RPC': process.env.RPC_URL,
  'Comparison': process.env.RPC_URL_COMPARE
}

async function getAssets () {
  let nfts = [];
  const keys = Object.keys(endpoints);

  const fetchAssets = keys.map(async (key) => {
    const connection = new web3.Connection(endpoints[key], 'confirmed');
    const umi = createUmi(endpoints[key]).use(mplBubblegum());
    const umiPublicKey = new web3.PublicKey(account);
    nfts[key] = await umi.rpc.getAssetsByOwner({owner: umiPublicKey});
    console.log(`${nfts[key]['total']} cNFTs from ${endpoints[key]}`);
  });

  // Wait for all the promises to resolve
  await Promise.all(fetchAssets);

  return nfts;  
}
// Set up web3 client
// const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');
// Setup the DAS API connection
// const umi = createUmi(process.env.RPC_URL).use(mplBubblegum());






console.log('');
console.log('Checking:',process.env.RPC_URL);
console.log(`Getting assets for ${account}\n`);
getAssets()
  .then(() => {
    console.log("\nEND\n");
  })
  .catch((e) => {
    console.log('\n', e, '\n');
  });

