import dotenv from 'dotenv';
dotenv.config();
const url = process.env.RPC_URL;

  const groupingValue = process.argv[2];

  if (!groupingValue) {
    console.error('Usage: node script.js <groupingValue>');
    process.exit(1);
  }

const searchAssets = async () => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'my-id',
      method: 'searchAssets',
      params: {
        grouping: ["collection", groupingValue],
        page: 1, // Starts at 1
        limit: 1000
      },
    }),
  });
  const { result } = await response.json();
  console.log("Assets: ", result);
};
searchAssets();
