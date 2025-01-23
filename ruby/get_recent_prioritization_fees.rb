# frozen_string_literal: true

# ruby get_recent_prioritization_fees.rb

require 'json'
require 'dotenv'

Dotenv.load
rpc_url = ENV['RPC_URL']

# Global Fees
crank_grpf = `curl #{ENV['RPC_URL']} -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [[], {"percentile": 7500}]}'`

crank_slot_fees = {}
all_slot_fees = {}

crank_grpf_parsed = JSON.parse(crank_grpf)
puts crank_grpf_parsed

crank_grpf_parsed['result'].each do |obs|
  # {"prioritization_fee"=>10000, "slot"=>172321287}
  crank_slot_fees[obs['slot']] = obs['prioritizationFee']
end
puts ''

crank_slot_fees.sort.each do |k,v|
  puts "#{k}\t#{v}"
end

# show the maximum value of the prioritization fee
puts "\nMAX: #{crank_slot_fees.values.max}\n\n"
