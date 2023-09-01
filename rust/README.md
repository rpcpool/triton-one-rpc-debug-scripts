# 

### Building

```
cargo build --release
```

## ENV

Copy `.env.sample` to `.env` for setting ENV variables.
- `RPC_URL` should point on HTTP endpoint, usually it's: `http://127.0.0.1:8899`. Required for `quic-staked-validators`.
- `WS_URL` should point on WebSocket ednpoint, usually it's: `ws://127.0.0.1:8900`. Required for `accounts-subscribe` and `slog-subscribe`.

### Usage

```
./target/release/account-subscribe
2022-07-11T16:14:33.189Z 0.117 sec.
2022-07-11T16:14:33.521Z 0.332 sec.
2022-07-11T16:14:34.656Z 1.135 sec.
^C
```

```
./target/release/slot-subscribe
2022-07-11T16:24:08.421Z 0.343 sec.
2022-07-11T16:24:09.460Z 1.038 sec.
2022-07-11T16:24:10.151Z 0.690 sec.
^C
```

```
./target/release/quic-staked-validators
IP Address      | Identity                                     | Version | Active Stake         | QUIC OK?
----------------+----------------------------------------------+---------+----------------------+---------
18.188.5.164    | XkCriyrNwS3G4rzAXtG5B1nnvb5Ka1JtCku93VqeKAr  | 1.10.32 |     8617029373399950 | ok
...
52.31.190.93    | A3nXCY954bSWMo9kB9FQWoeenNq3ZBnzUwFLWHfduCSs | 1.10.32 |            266769518 | ok
Nodes: 1799

IP Address      | Identity                                     | Version | Active Stake         | QUIC OK?
----------------+----------------------------------------------+---------+----------------------+---------
35.164.26.16    | krakeNd6ednDPEXxHAmoBs1qKVM8kLg79PvWF2mhXV1  | 1.10.31 |     5689282263096734 | timed out
...
94.130.64.51    | 8j5kjKAufwdJH7GitGY18Qp12EhEQkVMc4PWZzGeH8Gw | 1.10.25 |       82475460478848 | aborted by peer: the cryptographic handshake failed: error 120: peer doesn't support any known protocol
Nodes: 107
```

```
./target/release/ws-perf  --perf slot --commitment finalized
#214395571	grpc +0000.055ms	pubsub +0000.000ms
#214395572	grpc +0000.000ms	pubsub +0000.010ms
#214395572	grpc +0000.000ms	pubsub +0347.562ms
#214395573	grpc +0013.333ms	pubsub +0000.000ms
#214395573	grpc +0000.000ms	pubsub +0383.237ms
#214395574	grpc +0018.060ms	pubsub +0000.000ms
#214395574	grpc +0000.000ms	pubsub +0313.126ms
```

```
./target/release/ws-whirligig-connections --grpc http://127.0.0.1:10000  --whirligig ws://127.0.0.1:8873 --commitment confirmed --address addr1 --address addr2 --count 10
slot #214831901 +0002.932ms
slot #214831902 +0016.872ms
slot #214831904 +0005.303ms
slot #214831907 +0011.124ms
```
