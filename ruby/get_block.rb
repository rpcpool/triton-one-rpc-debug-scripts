# ruby demo_get_block.rb

require 'solana_rpc_ruby'
require 'pry'
require 'dotenv'
require 'time'

Dotenv.load
rpc_url = ENV['RPC_URL']

SolanaRpcRuby.config do |c|
  c.json_rpc_version = '2.0'
  c.cluster = rpc_url
end

method_wrapper = SolanaRpcRuby::MethodsWrapper.new(cluster: SolanaRpcRuby.cluster)

puts "slot      TX-count"
110771234.upto(110771235).each do |slot|
  begin
    block = method_wrapper.get_block(slot)
  rescue SolanaRpcRuby::ApiError
    block = nil
  end

  tx_count = block.nil? ? 0 : block.result['transactions'].count

  # byebug
  puts "#{slot} #{tx_count}"
  sleep(1)
end
