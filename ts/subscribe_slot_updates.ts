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

  // Subscribe for events
  const stream = await client.subscribe();

  // Create `error` / `end` handler
  const streamClosed = new Promise<void>((resolve, reject) => {
    stream.on("error", (error) => {
      reject(error);
      stream.end();
    });
    stream.on("end", () => {
      resolve();
    });
    stream.on("close", () => {
      resolve();
    });
  });

  // Handle updates
  let lastTimestamp = new Date();
  stream.on("data", (data) => {
    let ts = new Date();
    if (data.filters[0] == "slot") {
      console.log(
        `${ts.toISOString()}: gRPC slot update: ${data.slot.slot} in ${ts.getTime() - lastTimestamp.getTime()}ms`
      );
      lastTimestamp = ts;
    } else if (data.pong) {
      console.log(`${ts.toISOString()}: Processed ping response!`);
    }
  });

  // Example subscribe request.
  // Listen to all slot updates.
  const slotRequest: SubscribeRequest = {
    slots: {
      slot: { filterByCommitment: true },
    },
    commitment: CommitmentLevel.PROCESSED,

    // Required, but unused arguments
    accounts: {},
    accountsDataSlice: [],
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
  };

  // Send subscribe request
  await new Promise<void>((resolve, reject) => {
    stream.write(slotRequest, (err: null | undefined) => {
      if (err === null || err === undefined) {
        resolve();
      } else {
        reject(err);
      }
    });
  }).catch((reason) => {
    console.error(reason);
    throw reason;
  });

  // Send pings every 5s to keep the connection open
  const pingRequest: SubscribeRequest = {
    ping: { id: 1 },
    // Required, but unused arguments
    accounts: {},
    accountsDataSlice: [],
    transactions: {},
    transactionsStatus: {},
    blocks: {},
    blocksMeta: {},
    entry: {},
    slots: {},
  };
  setInterval(async () => {
    await new Promise<void>((resolve, reject) => {
      stream.write(pingRequest, (err: null | undefined) => {
        if (err === null || err === undefined) {
          resolve();
        } else {
          reject(err);
        }
      });
    }).catch((reason) => {
      console.error(reason);
      throw reason;
    });
  }, PING_INTERVAL_MS);

  await streamClosed;
}

main();
