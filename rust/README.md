# 

### Building

```
cargo build --release
```

## ENV

Check `.env.sample` for setting ENV variable. `RPC_URL` should point on WebSocket ednpoint, usually it's: `ws://127.0.0.1:8900`.

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
