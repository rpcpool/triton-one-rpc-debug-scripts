// get the token accounts for a given owner account.
//
// Output to the console will show the difference between the results of the 
// RPC_URL and RPC_URL_COMPARE endpoints.
//
// Example Use:
// node get_token_account_accounts_by_owner_compare.mjs OWNER_PUBLIC_KEY

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Read the owner account from the command line
const owner = process.argv[2];
const tokenkeg = new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const endpoints = {
  'RPC': process.env.RPC_URL,
  'Comparison': process.env.RPC_URL_COMPARE
}

// Get accounts from getTokenAccountsByOwner for each endpoint
async function getTABO() {
  let pubkeys = {}
  const keys = Object.keys(endpoints);
  console.log(`finding token accounts for owner: ${owner}\n`);

  // Loop through endpoints and run getTokenAccountsByOwner
  const fetchAccounts = keys.map(async (key) => {
    let endpoint = endpoints[key];
    let host_name = new URL(endpoint).hostname;
    pubkeys[key] = [];

    // Set up web3 client
    const connection = new web3.Connection(endpoint, 'confirmed');

    try {
      let start_time = new Date();

      const accounts = await connection.getTokenAccountsByOwner(
        new web3.PublicKey(owner),
        { programId: tokenkeg }
      );

      let elapsed_time = new Date() - start_time;

      console.log('Checking:',host_name,"\n",new Date().toISOString(), accounts.value.length, 'accounts in', elapsed_time, "milliseconds\n");
    } catch (e) {
      console.log('\n', e, '\n');
    }
  });

    // Wait for all the promises to resolve
    await Promise.all(fetchAccounts);

    // Return the final value of pubkeys
    return pubkeys;
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

getTABO()
  // .then((pubkeys) => {
  //   console.log(`Pubkeys in RPC but not Comparison:\n ${diffArray(pubkeys['RPC'], pubkeys['Comparison'])}\n`);
  //   console.log(`Pubkeys in Comparison but not RPC:\n ${diffArray(pubkeys['Comparison'], pubkeys['RPC'])}\n`);    
  // })
  .catch(error => {
    console.error('Error:', error);
  });
