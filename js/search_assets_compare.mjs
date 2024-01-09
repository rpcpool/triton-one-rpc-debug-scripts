import dotenv from 'dotenv';
dotenv.config();
const url1 = process.env.RPC_URL;
const url2 = process.env.RPC_URL_COMPARE;

const searchAssets = async (url) => {
  try {
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
          page: 1,
          limit: 1000
        },
      }),
    });

    const { result } = await response.json();
    console.log(`Assets from ${url}: `, result);
    return result;
  } catch (error) {
    console.error(`Error fetching assets from ${url}:`, error.message);
    return null;
  }
};

const compareResults = (result1, result2) => {
  if (result1 && result2) {
    const isEqual = JSON.stringify(result1) === JSON.stringify(result2);
    console.log("Results are equal:", isEqual);
  } else {
    console.log("Unable to compare results. Check for errors in fetching.");
  }
};

const main = async () => {
  const result1 = await searchAssets(url1);
  const result2 = await searchAssets(url2);

  compareResults(result1, result2);
};

main();
