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

// Setup getProgramAccounts call & gpa_filters. Uncomment the examples below to
// use them.
//
// Marinade
// const program_id = 'Stake11111111111111111111111111111111111111';
// const bytes = '4bZ6o3eUUNXhKuqjdCnCoPAoLgWiuLYixKaxoa8PpiKk';
// const offset = 12;
// const gpa_filters = [
//   { memcmp: { offset: offset, bytes: bytes } }
// ];
//
// Stake Program for a Wallet
const program_id = 'Stake11111111111111111111111111111111111111';
const bytes = 'ADDRESS-HERE';
const offset = 44;
const gpa_filters = [
  { memcmp: { offset: offset, bytes: bytes } }
];

// OpenBook Example One:
// const program_id = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';
// const gpa_filters = [
//   { memcmp: {
//       offset:13, 
//       bytes: '9tJB1d9LMt6rbZyYxivKGzKKFogfsxyroJpkYLsSN13Z'
//     }
//   },
//   { memcmp: {
//       offset:45, 
//       bytes: 'CkvRjxTtotXBuYjBXVkcyDfd3qoEgeLnQecxFfPg1ZcN'
//     }
//   },
//   { dataSize: 3228 }
// ];
//
// OpenBook Example Two:
// const program_id = 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX';
// const gpa_filters = [
//   { memcmp: {
//      offset: 13,
//      bytes: '8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6'
//     }
//   },
//   { memcmp: {
//       offset: 45,
//       bytes: 'F9NY3NZAgtWNqLNSFA8Lse6JBYZHkBEXbJ1ssUbUEYWR'
//     }
//   }, 
//   { dataSize: 3228 }
// ];

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
