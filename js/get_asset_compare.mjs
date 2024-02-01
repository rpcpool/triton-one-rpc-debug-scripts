import { Command } from "commander";
import fetch from "node-fetch";
import { diffString, diff } from "json-diff";

const program = new Command();

program
  .requiredOption("-u, --url <url>", "First URL to fetch assets from")
  .requiredOption("-i, --id <id>", "ID of the asset to compare")
  .requiredOption("-c, --compare <compare>", "Second URL to fetch assets from")
  .option(
    "-e, --exclude <fields>",
    "Comma separated list of fields to exclude from the compare",
    "content"
  );

program.parse(process.argv);

const options = program.opts();
const excludeKeys = options.exclude.split(",");

const getAsset = async (url, id) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "getAssetCompare",
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

const compareAssets = async (url1, url2, id) => {
  const asset1 = await getAsset(url1, id);
  const asset2 = await getAsset(url2, id);

  const differences = diff(asset1, asset2, { excludeKeys });

  if (differences) {
    console.log(diffString(asset1, asset2, { excludeKeys }));
  } else {
    console.log("No differences found.");
  }
};

compareAssets(options.url, options.compare, options.id)
  .then(() => console.log("Comparison complete."))
  .catch((error) =>
    console.error("An error occurred during comparison:", error)
  );
