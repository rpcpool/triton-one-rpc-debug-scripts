import { Command } from "commander";
import fetch from "node-fetch";

const program = new Command();

program
  .requiredOption("-u, --url <url>", "URL to fetch asset from")
  .requiredOption("-i, --id <id>", "ID of the asset to fetch");

program.parse(process.argv);

const options = program.opts();

const getAsset = async (url, id) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "getAsset",
        method: "getAsset",
        params: {
          id,
        },
      }),
    });

    const { result } = await response.json();
    return result;
  } catch (error) {
    console.error(`Error fetching asset from ${url}:`, error.message);
    return null;
  }
};

const printAsset = async (url, id) => {
  const asset = await getAsset(url, id);
  if (asset) {
    console.log(JSON.stringify(asset, null, 2));
  } else {
    console.log("Asset not found.");
  }
};

printAsset(options.url, options.id)
  .then(() => console.log("Asset retrieval complete."))
  .catch((error) =>
    console.error("An error occurred during asset retrieval:", error)
  );
