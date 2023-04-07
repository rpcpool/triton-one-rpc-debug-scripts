# frozen_string_literal: true

# ruby get_recent_prioritization_fees.rb

require 'json'

# Pyth SOL/USD
# crank_grpf = `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"]]}'`

# Pyth SPY/USD
# crank_grpf = `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["2k1qZ9ZMNUNmpGghq6ZQRj7z2d2ATNnzzYugVhiTDCPn"]]}'`

# Pyth AAPL/USD 5yixRcKtcs5BZ1K2FsLFwmES1MyA92d6efvijjVevQCw
crank_grpf = `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["5yixRcKtcs5BZ1K2FsLFwmES1MyA92d6efvijjVevQCw"]]}'`

# https://solscan.io/tx/4ELeyksZeQuyAv7jWLhDJ8hmWApVoijTND6biPfciAuzaRdHnbZdnaY1H2M8XycDqzzvCf3KTU4YpcUhWmtrbnDw
# crank_grpf = `curl https://lb-nyc1.rpcpool.com/20dc90af2aed522cdff09bab309e -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["HmiHHzq4Fym9e1D4qzLS6LDDM3tNsCTBPDWHTLZ763jY", "5Di65JsuLU7n8RLZBPhWwHyxVTHM1feLXZnX6VjGpG7S", "8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6", "8CvwxZ9Db6XbLD46NZwwmVDZZRDy7eydFcAGkXKh9axa", "Bzmr3xA8sWsHogARhFvJALR9o58xXk4jUnPZ4ARhez8w"]]}'`

# SOL/USDC
# https://solscan.io/tx/5eTR89FQ74BkvP5ReoHXQiQGwctFXbRuajTYAYZHZHzststeJ9kBYtra44gvFT4DeCobxBKhrUewcegQZJecqdDh
# crank_grpf = `curl https://lb-ams2.rpcpool.com/20dc90af2aed522cdff09bab309e -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["EjtNLRpfcFhxAoavNaUXjLG9DevQrMuCiaXeGrCtZunE", "6sy2Wd7ochCV4gd5ZFNxytfzCGaGEG8RU3DF78Zcwdhd", "9eKyCvuMxGDRb8xFyYDK76mSGdXqLK8pNtT4dSnxH3Vw", "35K4zQJdtWfJ6p7QPSHY5YkL4Cvwb3NTTETGfpgZsUVC", "H5vzMRaVL4G1tyHLjHgXDUKL1jFqGhtjnArfYuHb2ZZb", "3mobQUAwRTj7QYEBbwGSnsoie4SWiRa2U4sgZ7KHbBct", "GtUDf67bMNkEbw2XcGVVJz6Gavfw1s76h2d5Rs4wd6DU", "5Di65JsuLU7n8RLZBPhWwHyxVTHM1feLXZnX6VjGpG7S", "EMAYHtdBSdYT2uFbEz8iZdsHtgDoEzGVicbmN65N6F2a", "6ZZCf5NwFdfk3WFtusTu1XA74oKf4rLAajW6Rquzds1N", "8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6", "8CvwxZ9Db6XbLD46NZwwmVDZZRDy7eydFcAGkXKh9axa", "Bzmr3xA8sWsHogARhFvJALR9o58xXk4jUnPZ4ARhez8w"]]}'`

# MSOL/USDC
# https://explorer.solana.com/tx/34ZbBUv1xs8QXBfDVDTUsqQEvRxy4goRtcct1w7SLzmFPkRhF6SCa2ptzDGBgUwZ67uDxxsQER7qWo3upJa2JY3b
# crank_grpf = `curl https://lb-ams2.rpcpool.com/20dc90af2aed522cdff09bab309e -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["BLcmYWJXZzM5ugabv8t9MGt5uZeQpLeeVHJEucb6JoM1", "9Lyhks5bQQxb9EyyX55NtgKQzpM4WK7JCmeaWuQ5MoXD", "B79QctKrkmGePVZp22TgPZfWdVAiXKwYqzREh82G9MfW","Bzmr3xA8sWsHogARhFvJALR9o58xXk4jUnPZ4ARhez8w", "CsB4XjwH4uZRjRXEXRBFJ3hi3mb9jujzRCW7NXg7TRtX"]]}'`

# https://explorer.solana.com/tx/2uUBHLaMo8ztCoQM918bd87EbmsTEadgNoP63LAUNjBvZfTxQB1ccNmesYdfiHcknGDFfHqYvYv6tjo1MQLXRfG7
# crank_grpf = `curl https://nyc50.rpcpool.com/20dc90af2aed522cdff09bab309e -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees", "params": [["8cMWuNmjfPFs2R2m3A7uzM4CPTFA5d2savEUeSRBGQ9x", "GBtLdkr21znHJDhU4vXmsNcE3wfQB8nd5eQErMLyDT93", "2PyDB2mgEgT7WnC6K9p7jWvELcU9xB7VzLsrcddG4FVs","CaDAUgEtYu5v28B6jp2RUp5kDQdiCZrdEcQN77nCxECV", "Dj6Vt2Dar6EivimUSZKRayuLpyAefDaGaYdecWzeuY6k","ADaXG254WcLm63J94mRLvLevu4GM1A4oyyYkyArEYmrG", "AtK4PHqmqXJGZdbsW3ztyZXzBt9VDaRi3e1Fj4ZFksJQ", "7Rys2xVfRfdB1Kxc7N3t4cy1PF4FnQHKEzav25Trp4EN", "3SmUefUMEuhy5eqa9y5PCkpapuyThX2ntphX8ZQ97vqt", "7yQbisr56CZHvHmTZCvtAFYJjBBXrAFSBGvzRwny4BWm", "ENFC7QDMoJeQV84ma12Vi8VzDUwnYBi31f9rHkRx3TEX", "4MNgw4apQ8kCQ2AvL7CM9WBQAqatt71xAmZKW8qSPGcP",  "BKcNWr11FPrgaRbGnE766Zb2u3ygcXG97re6DR99SHnq", "2VPaLbSd7mGhPChZX8fHLhXaVADRp8HHfkzDAmh7DM3m", "9aSYbBen5a8CUEV3nkC8KDoM8F5bpcnqytSrEGVwqZT5", "FbjLh8Qgsg5RPBpnbqX6RT3dJTwL9v2f1rSfLbGTSbn8", "6482e33zrerYfhKAjPR2ncMSrH2tbTy5LDjdhB5PXzxd", "3BQCyicEHqXVsQicA8xeoTLHjMD5HPR2BiCZsPyJTvdg", "AtWMMJa1dMSfWHWVGbpuSuk4a645kayfb4vrFVjeBHif", "3uP3wUyVHGPzhT7gkDsQWMc3aqH1S8i9Vv3kdAiDt6i3", "Afw4B8B9arBkWGcr8C9UvgrGjxc35Y5afDA7MTZrPKAW"]]}'`

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

# puts ''

# all_grpf = `curl https://lb-ams2.rpcpool.com/20dc90af2aed522cdff09bab309e -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0", "id":1, "method":"getRecentPrioritizationFees"}'`
# all_grpf_parsed = JSON.parse(all_grpf)
# puts all_grpf_parsed

# all_grpf_parsed['result'].each do |obs|
#   # {"prioritization_fee"=>10000, "slot"=>172321287}
#   all_slot_fees[obs['slot']] = obs['prioritization_fee']
# end
# puts ''

# all_slot_fees.sort.each do |k,v|
#   puts "#{k}\t#{v}"
# end
