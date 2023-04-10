// This script will run a getProgramAccounts query on the Stake... program ID. 
// Output to the console will show the number of records returned and the 
// elapsed time in milliseconds. On error, the script will exit and dump 
// error details to the console.
//
// Provide RPC_URL in your .env file to check your connection.
//
// Example Use:
// node get_program_accounts.mjs

import * as web3 from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

// Set up web3 client
const connection = new web3.Connection(process.env.RPC_URL, 'confirmed');

// Setup getProgramAccounts call
//
// Marinade
const program_id = 'Stake11111111111111111111111111111111111111';
const bytes = '4bZ6o3eUUNXhKuqjdCnCoPAoLgWiuLYixKaxoa8PpiKk';
const offset = 12;
const gpa_filters = [
  // { dataSize: data_size },
  { memcmp: { offset: offset, bytes: bytes } }
];

console.log('Checking:',process.env.RPC_URL,"\n");

// Run getProgramAccounts
try {
  let start_time = new Date();
  const program_key = new web3.PublicKey(program_id);

  const accounts = await connection.getProgramAccounts(
    program_key,
    { filters: gpa_filters }
  );

  let elapsed_time = new Date() - start_time;
  console.log(new Date().toISOString(), accounts.length, 'accounts in', elapsed_time, "milliseconds\n");
} catch (e) {
  console.log('\n', e, '\n');
}

// Appendix:
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
