# triton-one-rpc-debug-scripts
A collection of scripts that can be used to debug Solana RPC connectivity issues.

## Client
See the `js` or `rust` folders for details related to your chosen client.

## ENV
Copy `.env.sample` to `.env` for setting ENV variable. `RPC_URL` should point to your HTTP ednpoint, usually it's: `http://127.0.0.1:8899`. The `.env` file should placed inside the `js` and `rust` folders, not this top-level folder.
