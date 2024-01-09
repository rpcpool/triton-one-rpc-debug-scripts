import dotenv from 'dotenv';
dotenv.config();

const url1 = process.env.RPC_URL;
const url2 = process.env.RPC_URL_COMPARE;

const searchAssets = async (url, groupingValue) => {
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
          grouping: ["collection", groupingValue], // Use the parsed CLI argument here
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
  // Parse the CLI argument for the grouping value
  const groupingValue = process.argv[2];

  if (!groupingValue) {
    console.error('Usage: node script.js <groupingValue>');
    process.exit(1);
  }

  const result1 = await searchAssets(url1, groupingValue);
  const result2 = await searchAssets(url2, groupingValue);

  compareResults(result1, result2);
};

main();
