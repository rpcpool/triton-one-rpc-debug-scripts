// Get compressed assets for the given owner.
//
// Provide RPC_URL & RPC_URL_COMPAREin your .env file to check your connection.
//
// Example Use:
// node get_assets_by_owner_compare.mjs <owner-account>

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
    const umi = createUmi(endpoints[key]).use(mplBubblegum());
    const umiPublicKey = new web3.PublicKey(account);
    nfts[key] = await umi.rpc.getAssetsByOwner({owner: umiPublicKey});
    console.log(`${nfts[key]['total']} assets from ${endpoints[key]}`);
  });

  // Wait for all the promises to resolve
  await Promise.all(fetchAssets);

  return nfts;  
}

// show the contents of an array that are not in another array
function diffArray(arr1, arr2) {
  let newArr = [];
  // Same, same; but different.
  for (let i = 0; i < arr1.length; i++) {
    if (arr2.indexOf(arr1[i]) === -1) {
      newArr.push(arr1[i]);
    }
  }
  return newArr;
}

console.log('');
console.log(`Getting assets for ${account}\n`);
getAssets()
  .then((nfts) => {
    let keys = Object.keys(nfts);
    // Get the difference between the two sets of assets
    let diff_1 = diffArray(
      nfts[keys[0]]['items'].map((item) => item.id), 
      nfts[keys[1]]['items'].map((item) => item.id)
    );
    console.log(`\n${diff_1.length} assets in ${endpoints[keys[0]]} that are not in ${endpoints[keys[1]]}:`);
    console.log(JSON.stringify(diff_1));

    // Get the difference the other way
    let diff_2 = diffArray(
      nfts[keys[1]]['items'].map((item) => item.id), 
      nfts[keys[0]]['items'].map((item) => item.id)
    );
    console.log(`\n${diff_2.length} assets in ${endpoints[keys[1]]} that are not in ${endpoints[keys[0]]}:`);
    console.log(JSON.stringify(diff_2));
  })
  .then(() => {
    console.log("\nEND\n");
  })
  .catch((e) => {
    console.log('\n', e, '\n');
  });
