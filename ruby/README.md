The Solana RPC Ruby gem requires Ruby 2.6+. It MIGHT work with lower versions, 
but was not tested with them. Add the following line to your Gemfile:

Run `bundle install`

Copy `.env.sample` to `.env` for setting ENV variables. `RPC_URL` should point to your HTTP ednpoint, For example: `http://127.0.0.1:8899`. The `.env` file should placed inside the `ruby` folder.

Try the subscriptions like: `ruby subscribe_slot.rb`
