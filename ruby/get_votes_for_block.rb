# ruby demo_get_block.rb

require 'solana_rpc_ruby'
require 'pry'
require 'dotenv'
require 'time'

Dotenv.load
rpc_url = ENV['RPC_URL']

slot = ARGV[0].to_i
raise "Please provide a slot number" if slot.nil?

SolanaRpcRuby.config do |c|
  c.json_rpc_version = '2.0'
  c.cluster = rpc_url
end

method_wrapper = SolanaRpcRuby::MethodsWrapper.new(cluster: SolanaRpcRuby.cluster)

puts "slot      TX-count"
begin
  block = method_wrapper.get_block(slot)
rescue SolanaRpcRuby::ApiError => e
  raise e unless e.message.include?('BlockNotFound')
  block = nil
end

tx_count = block.nil? ? 0 : block.result['transactions'].count

# byebug
puts "#{slot} #{tx_count}"
# sleep(1)
puts block.inspect