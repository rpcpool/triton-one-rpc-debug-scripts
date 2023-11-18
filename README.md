# triton-one-rpc-debug-scripts
A collection of scripts that can be used to debug Solana RPC connectivity issues.

## Client
See the `js`, `ruby`, or `rust` folders for details related to your chosen client. Remember to `cd` into that directory -- do not run the scripts from this top-level folder.

## ENV
Once inside the working directory, copy `.env.sample` to `.env` for setting ENV variables. `RPC_URL` should point to your HTTP ednpoint, For example, `http://127.0.0.1:8899`. The `.env` file should placed inside the `js`, `ruby`, or `rust` folders, not this top-level folder.
