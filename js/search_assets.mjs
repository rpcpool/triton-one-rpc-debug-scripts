import dotenv from 'dotenv';
dotenv.config();
const url = process.env.RPC_URL;

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
        grouping: ["collection", "DEEZyno8D9RCCghEWkTNarZrCW7HvvWE9z64tiqvQKpH"],
        page: 1, // Starts at 1
        limit: 1000
      },
    }),
  });
  const { result } = await response.json();
  console.log("Assets: ", result);
};
searchAssets();
