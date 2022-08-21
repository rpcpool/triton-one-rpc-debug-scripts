# ruby get_signatures_for_address.rb [ADDRESS]

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

account = ARGV[0]
if account 
  method_wrapper = SolanaRpcRuby::MethodsWrapper.new(cluster: SolanaRpcRuby.cluster)
  sigs = method_wrapper.get_signatures_for_address(account)
  sigs.result.each do |s|
    puts s.inspect
  end
else
  puts "No account provided."
end
