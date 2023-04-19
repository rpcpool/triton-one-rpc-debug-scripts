// get account info for a given account from two different RPC endpoints.
//
// Output to the console will show the difference between the results of the 
// RPC_URL and RPC_URL_COMPARE endpoints.
//
// Example Use:
// Provide RPC_URL & RPC_URL_COMPARE in your .env file.
//
// node get_account_info_compare.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const account = 'DukyuqzWpy1BQdG5pLarZzbW2Bxf4wQDNKayPenVBoXd';

const endpoints = {
  'RPC': process.env.RPC_URL,
  'RPC_COMPARE': process.env.RPC_URL_COMPARE
};

// get accounts from getAccountInfo for each endpoint.
async function getAccounts() {
  let accounts =  {};
  const keys = Object.keys(endpoints);

  // Loop through endpoints and run getAccountInfo
  const fetchAccounts = keys.map(async (key) => {
    let endpoint = endpoints[key];
    accounts[key] = [];

    // Set up web3 client
    const connection = new web3.Connection(endpoint, 'confirmed');

    try {
      let start_time = new Date();
      let acc = new web3.PublicKey(account);
      const info = await connection.getAccountInfo(acc);
      accounts[key] = info;

      // Log results
      let elapsed_time = new Date() - start_time;
      console.log(`Checking: ${endpoint} \n ${new Date().toISOString()} ${elapsed_time} milliseconds\n`);
    } catch (e) {
      console.log('\n', e, '\n');
    }
  });

  await Promise.all(fetchAccounts);

  return accounts;
}

getAccounts()
  .then((accounts) => {
    console.log(accounts);
  })
  .catch((e) => {
    console.log('\n', e, '\n');
  }
);
