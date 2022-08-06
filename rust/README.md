# 

### Building

```
cargo build --release
```

## ENV

Check `.env.sample` for setting ENV variable.
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
TODO./target/debug/quic-staked-validators 
IP Address      | Identity                                     | Gossip | TPU   | RPC Address           | Version | Feature Set    | QUIC
----------------+----------------------------------------------+--------+-------+-----------------------+---------+----------------+-----
141.95.2.240    | Fsdv1iumCDDd3Hbs8ZGG9UhbVBfHbhkohmC4y8N81mpg | 9300   | 9303  | none                  | 1.10.34 | 483097211      | ok
...
141.98.219.196  | PYJstkhQNfWBCnQtN7MYMH2nvmL37rxLwVyqjX5ohGn  | 8000   | 8003  | none                  | 1.10.34 | 483097211      | ok
Nodes: 1806

IP Address      | Identity                                     | Gossip | TPU   | RPC Address           | Version | Feature Set    | QUIC
----------------+----------------------------------------------+--------+-------+-----------------------+---------+----------------+-----
213.133.99.147  | 7oerTAUkraPoi4ucomtHcaLqaifChWj7SaBS42f1bbmf | 8000   | 8003  | none                  | 1.10.25 | 965221688      | ConnectionError(ConnectionClosed(ConnectionClose { error_code: Code::crypto(78), frame_type: None, reason: b"peer doesn't support any known protocol" }))
...
45.77.29.210    | 9AvtEMGgemx4XPgz6LyxB87a9bfkAmYyFgy5YsLJpuz8 | 8001   | 8004  | 45.77.29.210:8899     | 1.10.31 | 4192065167     | ConnectionError(TimedOut)
Nodes: 106
```
