# triton-one-rpc-debug-scripts
A collection of scripts that can be used to debug Solana RPC connectivity issues.

## Install Notes
Try `yarn install`. If that doesn't work, see package.json and add the libraries you see there.

We use 'dotenv' to hold sensitive data. Copy `.env.sample` to `.env` and provide your RPC URL in the `.env` file.

## ENV

Check `.env.sample` for setting ENV variable. `RPC_URL` should point an HTTP ednpoint, usually it's: `http://127.0.0.1:8899`.

For Metaplex API docs, see https://developers.metaplex.com/bubblegum/getting-started/js