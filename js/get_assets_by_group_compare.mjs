import { Command } from "commander";
import dotenv from "dotenv";
import jsonDiff from "json-diff";
import fetch from "node-fetch";

dotenv.config();

const program = new Command();

program
  .requiredOption(
    "-u, --urls <urls>",
    "comma-separated list of URLs to compare"
  )
  .requiredOption("-g, --group <group>", "group value to filter by")
  .option("-s, --start-page <number>", "start page number", "1")
  .option("-e, --end-page <number>", "end page number")
  .option("-l, --limit <number>", "number of results per page", "1000")
  .option("-d, --diff", "print the difference", true)
  .option(
    "-e, --exclude <fields>",
    "Comma separated list of fields to exclude from the compare",
    "content"
  );

program.parse(process.argv);

const options = program.opts();
const urls = options.urls.split(",");
const limit = parseInt(options.limit, 10);
const startPage = parseInt(options.startPage, 10);
const excludeKeys = options.exclude.split(",");
const endPage = options.endPage ? parseInt(options.endPage, 10) : Infinity;
const printDiff = options.diff;

const getAssetByGroup = async (url, groupingValue, page) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "123",
        method: "getAssetsByGroup",
        params: {
          groupKey: "collection",
          groupValue: groupingValue,
          page,
          limit,
        },
      }),
    });

    const { result } = await response.json();

    return result.items || [];
  } catch (error) {
    console.error(`Error fetching assets from ${url}:`, error.message);
    return [];
  }
};

const main = async () => {
  const { group } = options;
  let page = startPage;
  let mismatchIds = {};
  let fetchMore = true;

  while (fetchMore && page <= endPage) {
    const results = await Promise.all(
      urls.map((url) => getAssetByGroup(url, group, page))
    );

    // Create a hash map where key is the item id and values is list of responses
    let assetsMap = {};
    results.forEach((result, urlIndex) => {
      result.forEach((item) => {
        if (!assetsMap[item.id]) {
          assetsMap[item.id] = Array(urls.length).fill(null);
        }
        assetsMap[item.id][urlIndex] = item;
      });
    });

    // Perform diff on each entry and gather mismatched ids
    Object.entries(assetsMap).forEach(([id, assets]) => {
      if (printDiff) {
        let diffs = assets.map((asset, index) => {
          return jsonDiff.diffString(
            asset,
            assets[(index + 1) % assets.length],
            {
              excludeKeys,
            }
          );
        });
        console.log(`Asset ID: ${id}`);
        diffs.forEach((diff) => console.log(diff));
      }

      if (
        assets.some((asset, index) =>
          jsonDiff.diff(asset, assets[(index + 1) % assets.length], {
            excludeKeys,
          })
        )
      ) {
        mismatchIds[id] = assets;
      }
    });

    fetchMore =
      results.every((result) => result.length === PAGE_SIZE) && page < endPage;
    page += 1;
  }

  // Print the list of mismatch ids at the end
  console.log(`Total mismatched ids: ${Object.keys(mismatchIds).length}`);
};

main();
