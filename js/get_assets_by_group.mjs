import { Command } from "commander";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const program = new Command();

program
  .requiredOption("-u, --url <url>", "URL to fetch assets from")
  .requiredOption("-g, --group <group>", "group value to filter by")
  .option("-p, --page <number>", "page number to start from", "1")
  .option("-l, --limit <number>", "number of results per page", "1000")
  .option("-s, --stop-page <number>", "page number to stop at");

program.parse(process.argv);

const options = program.opts();
const url = options.url;
const PAGE_SIZE = parseInt(options.limit, 10);
const stopPage = options.stopPage ? parseInt(options.stopPage, 10) : null;

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
          limit: PAGE_SIZE,
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
  const { group, page: startPage, diff } = options;
  let page = parseInt(startPage, 10);
  let allIds = [];
  let fetchMore = true;

  while (fetchMore && (stopPage === null || page <= stopPage)) {
    const result = await getAssetByGroup(url, group, page);

    allIds.push(...result.map((item) => item.id));

    fetchMore = result.length === PAGE_SIZE;
    page += 1;
  }

  console.log(JSON.stringify(allIds, null, 2));
};

main();
