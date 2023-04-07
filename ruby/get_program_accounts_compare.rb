# ruby get_program_accounts_compare.rb


require 'solana_rpc_ruby'
require 'pry'
require 'dotenv'
require 'time'

Dotenv.load

# Marinade
program_id = 'Stake11111111111111111111111111111111111111'
bytes = '4bZ6o3eUUNXhKuqjdCnCoPAoLgWiuLYixKaxoa8PpiKk'
offset = 12

endpoints = {
  RPC: ENV['RPC_URL'],
  Steamboat: ENV['RPC_URL_COMPARE']
}

# results = {}
pubkeys = {}

endpoints.each do |k, v|
  puts "Processing #{k} => #{v}"
  pubkeys[k] = [] if pubkeys[k].nil?

  SolanaRpcRuby.config do |c|
    c.json_rpc_version = '2.0'
    c.cluster = v
  end

  method_wrapper = SolanaRpcRuby::MethodsWrapper.new(cluster: SolanaRpcRuby.cluster)
  accounts = method_wrapper.get_program_accounts(
    program_id,
    encoding: 'base64',
    filters: [
      { memcmp: { offset: offset, bytes: bytes } }
    ]
  )

  accounts.result.each do |sa|
    pubkeys[k] << sa['pubkey']
  end
  puts pubkeys[k].count
  # results[k] = {} if results[k].nil?
  # results[k] = accounts.result
  # puts results[k].count
end

# puts results[:Steamboat]-results[:RPC]
puts 'Pubkeys in Steamboat, but not in RPC:'
puts pubkeys[:Steamboat]-pubkeys[:RPC]
puts ''
puts 'Pubkeys in RPC, but not in Steamboat:'
puts pubkeys[:RPC]-pubkeys[:Steamboat]
puts ''
