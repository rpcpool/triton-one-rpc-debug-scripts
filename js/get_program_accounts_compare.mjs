// This script will run a getProgramAccounts query on the Stake... program ID. 
// Output to the console will show the difference between the results of the 
// RPC_URL and RPC_URL_COMPARE endpoints.
//
// Example Use:
// Provide RPC_URL & RPC_URL_COMPARE in your .env file.
//
// node get_program_accounts_compare.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Setup getProgramAccounts call & gpa_filters.
//
// Marinade
const program_id = 'Stake11111111111111111111111111111111111111';
const bytes = '4bZ6o3eUUNXhKuqjdCnCoPAoLgWiuLYixKaxoa8PpiKk';
const offset = 12;
const gpa_filters = [
  // { dataSize: data_size },
  { memcmp: { offset: offset, bytes: bytes } }
];

const endpoints = {
  'RPC': process.env.RPC_URL,
  'Comparison': process.env.RPC_URL_COMPARE
}

// Get pubkeys from getProgramAccounts for each endpoint.
async function getPubkeys () {
  let pubkeys = {}
  const keys = Object.keys(endpoints);

  // Loop through endpoints and run getProgramAccounts
  const fetchAccounts = keys.map(async (key) => {
    let endpoint = endpoints[key];
    pubkeys[key] = [];

    // Set up web3 client
    const connection = new web3.Connection(endpoint, 'confirmed');

    try {
      let start_time = new Date();
      let program_key = new web3.PublicKey(program_id);

      let accounts = await connection.getProgramAccounts(
        program_key,
        { filters: gpa_filters }
      );

      // Add the pubkeys to the pubkeys array
      accounts.forEach(acct => {
        pubkeys[key].push(acct['pubkey'].toBase58());
      });

      // Log the results
      let elapsed_time = new Date() - start_time;
      console.log('Checking:',endpoint,"\n",new Date().toISOString(), accounts.length, 'accounts in', elapsed_time, "milliseconds\n");
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

getPubkeys()
  .then((pubkeys) => {
    console.log(`Pubkeys in RPC but not Comparison:\n ${diffArray(pubkeys['RPC'], pubkeys['Comparison'])}\n`);
    console.log(`Pubkeys in Comparison but not RPC:\n ${diffArray(pubkeys['Comparison'], pubkeys['RPC'])}\n`);    
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Appendix
// 
// OpenBook
// const program_id = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'; // Program
// const bytes = '5jWUncPNBMZJ3sTHKmMLszypVkoRK6bfEQMQUHweeQnh'; // Filter
// const data_size = 3228;
// const offset = 45;
// # bytes_list = ["DxFJrKS2demp8TmN2c4Gp4MCQgFBvtK8SvdeeWKyCScE", "2tTPiyXKifAtwLasZwkpdSKmJQvG6LuQ7k8cV3TC5HxM", "3KiMpRp7kH1WBkVCTQ1SMpeFp9HSvfzX7V5k5JkSpqMg",'9ycmYnQmDRhrUTWLspW1Q4Yn8EDtYn3wCUc9Q72YVrmb','8BySRezwLPxgo5r4zCnfmaxTt16ufCPD7FP475k6K4TT','Cyfs4gas18c3gxHF3Hs2vo7HBKWyi6kjeXXpS93qWKSK','B9FpdsWUqrhPmBNiDGDYRUPV77dFocf32jMJa4G2PwwL','4fEuQEAeySDjDLrzVTr2Mp8GTaJZj4z8f2Zt6r4PSQof']
// Tokenkeg
// const program_id = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'; // Program
// const bytes = 'CwyQtt6xGptR7PaxrrksgqBSRCZ3Zb2GjUYjKD9jH3tf'; // Filter
// const offset = 32;
// const data_size = 165;
//
