require 'solana_rpc_ruby'
require 'pry'
require 'dotenv'
require 'time'

Dotenv.load
rpc_url = ENV['RPC_URL']

cluster = rpc_url
raise "Please provide a cluster endpoint in this format: ws://api.mainnet-beta.solana.com" if cluster.nil?

SolanaRpcRuby.config do |c|
  c.json_rpc_version = '2.0'
  c.ws_cluster = cluster
end

puts SolanaRpcRuby.json_rpc_version
puts SolanaRpcRuby.ws_cluster

ws_method_wrapper = SolanaRpcRuby::WebsocketsMethodsWrapper.new(cluster: SolanaRpcRuby.cluster)

interrupted = false
trap('INT') { interrupted = true }

begin
  time_last = Time.now
  ws_method_wrapper.root_subscribe do |message|
    json = JSON.parse(message)
    # puts json['params']
    time_elapsed = Time.now - time_last
    puts "#{Time.now.utc.iso8601(3)} #{json['params']} #{time_elapsed.round(4)} sec."
    time_last = Time.now
    break if interrupted
  end
rescue SolanaRpcRuby::ApiError => e
  puts e.inspect
end # begin

# Example of block that can be passed to the method to manipualte the data.
# block = Proc.new do |message|
#   json = JSON.parse(message)
#   puts json['params']
# end

# Methods docs: https://docs.solana.com/developing/clients/jsonrpc-api#subscription-websocket
# Uncomment one of the methods below to see the output.
# Without the block the websocket message will be printed to the console.
#
# ws_method_wrapper.account_subscribe(account_id)
# ws_method_wrapper.account_subscribe(account_id, &block)
# ws_method_wrapper.logs_subscribe('all')
# ws_method_wrapper.logs_subscribe('all', &block)
# ws_method_wrapper.program_subscribe(program_id)
# ws_method_wrapper.program_subscribe(program_id, &block)
# ws_method_wrapper.root_subscribe
# ws_method_wrapper.root_subscribe(&block)
# ws_method_wrapper.signature_subscribe('provide_signature')
# ws_method_wrapper.slot_subscribe(&block)
# ws_method_wrapper.slots_updates_subscribe
# ws_method_wrapper.slots_updates_subscribe(&block)
# ws_method_wrapper.vote_subscribe(&block) # unstable, disabled by default, check the solana docs
