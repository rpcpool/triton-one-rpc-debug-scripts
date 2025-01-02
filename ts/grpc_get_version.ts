import Client, {
  CommitmentLevel,
  SubscribeRequest,
  SubscribeRequestFilterAccountsFilter,
} from "@triton-one/yellowstone-grpc";

import dotenv from 'dotenv';
dotenv.config();


const GRPC_URL = process.env.GRPC_URL || "https://api.mainnet-beta.solana.com";
const X_TOKEN = process.env.GRPC_X_TOKEN || "x-token";
const PING_INTERVAL_MS = 30_000; // 30s

async function main() {
  // Open connection.
  const client = new Client(GRPC_URL, X_TOKEN, {
    "grpc.max_receive_message_length": 64 * 1024 * 1024, // 64MiB
  });

  // Get and print version
  const version = await client.getVersion()
  console.log(JSON.parse(version));

}

main();
