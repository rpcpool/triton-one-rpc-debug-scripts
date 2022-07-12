# triton-one-rpc-debug-scripts
A collection of scripts that can be used to debug Solana RPC connectivity issues.

## Install Notes
Try `yarn install`. If that doesn't work, use: `yarn add @solana/web3.js` & `yarn add dotenv`.

We use 'dotenv' to hold sensitive data. Copy `.env.sample` to `.env` and provide your RPC URL in the `.env` file.

## ENV

Check `.env.sample` for setting ENV variable. `RPC_URL` should point on HTTP ednpoint, usually it's: `http://127.0.0.1:8899`.
