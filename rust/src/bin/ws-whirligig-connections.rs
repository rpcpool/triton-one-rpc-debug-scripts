use {
    anyhow::Context,
    clap::{Parser, ValueEnum},
    futures::{
        channel::mpsc,
        sink::SinkExt,
        stream::{select_all, BoxStream, StreamExt},
    },
    maplit::hashmap,
    solana_account_decoder::{UiAccountEncoding, UiDataSliceConfig},
    solana_client::{nonblocking::pubsub_client::PubsubClient, rpc_config::RpcAccountInfoConfig},
    solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey},
    std::{
        collections::{btree_map::Entry, BTreeMap, HashMap},
        fmt,
        time::Instant,
    },
    tonic::{
        metadata::AsciiMetadataValue,
        transport::channel::{Channel, ClientTlsConfig},
        Request, Response, Streaming,
    },
    yellowstone_grpc_proto::prelude::{
        geyser_client::GeyserClient, subscribe_update::UpdateOneof, CommitmentLevel,
        SubscribeRequest, SubscribeRequestFilterSlots, SubscribeUpdate,
    },
};

#[derive(Debug, Parser)]
#[clap(author, version, about)]
struct Args {
    /// gRPC service endpoint
    #[clap(long, default_value_t = String::from("http://127.0.0.1:10000"))]
    grpc: String,
    /// Optional token for access to gRPC
    #[clap(long)]
    grpc_x_token: Option<String>,

    /// Whirligig service endpoing
    #[clap(long, default_value_t = String::from("ws://127.0.0.1:8873/streams"))]
    whirligig: String,

    /// Commitment level
    #[clap(long, default_value_t = ArgsCommitment::Finalized)]
    commitment: ArgsCommitment,

    /// Number of connections to Whirligig
    #[clap(long, default_value_t = 2)]
    count: usize,

    #[clap(long)]
    address: Vec<String>,
}

impl Args {
    fn get_addresses(&self) -> anyhow::Result<Vec<Pubkey>> {
        self.address
            .iter()
            .map(|addr| addr.parse())
            .collect::<Result<Vec<Pubkey>, _>>()
            .map_err(Into::into)
    }
}

#[derive(Debug, Clone, Copy, ValueEnum)]
enum ArgsCommitment {
    Processed,
    Confirmed,
    Finalized,
}

impl fmt::Display for ArgsCommitment {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Self::Processed => "processed",
                Self::Confirmed => "confirmed",
                Self::Finalized => "finalized",
            }
        )
    }
}

impl ArgsCommitment {
    const fn to_proto(self) -> i32 {
        (match self {
            Self::Processed => CommitmentLevel::Processed,
            Self::Confirmed => CommitmentLevel::Confirmed,
            Self::Finalized => CommitmentLevel::Finalized,
        }) as i32
    }

    const fn to_solana(self) -> CommitmentConfig {
        match self {
            Self::Processed => CommitmentConfig::processed(),
            Self::Confirmed => CommitmentConfig::confirmed(),
            Self::Finalized => CommitmentConfig::finalized(),
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    let addresses = args.get_addresses()?;
    let mut pubsubs = vec![];
    let mut streams = vec![];
    for _ in 0..args.count {
        let pubsub = PubsubClient::new(&args.whirligig)
            .await
            .context("failed to connect to whirligig")?;
        pubsubs.push(pubsub);
    }
    for pubsub in pubsubs.iter() {
        streams.push(whirligig_subscribe(pubsub, &addresses, args.commitment).await?);
    }
    let mut whirligig = select_all(streams).boxed();

    let mut grpc = grpc_subscribe_slots(args.grpc, args.grpc_x_token, args.commitment).await?;

    let size = addresses.len() * args.count;
    let mut slots: BTreeMap<u64, (Instant, usize)> = BTreeMap::new();
    loop {
        tokio::select! {
            msg = whirligig.next() => {
                let slot = if let Some((_pubkey, slot)) = msg {
                    slot
                } else {
                    panic!("stream finished");
                };

                if let Entry::Occupied(mut entry) = slots.entry(slot) {
                    let entry = entry.get_mut();
                    entry.1 += 1;

                    if entry.1 == size {
                        let delay = entry.0.elapsed().as_micros() as f64 / 1000f64;
                        println!("slot #{slot} +{delay:0>8.3}ms");
                    }
                }
            },
            msg = grpc.next() => {
                let slot = if let Some(slot) = msg {
                    slot
                } else {
                    panic!("stream finished");
                };
                slots.entry(slot).or_insert((Instant::now(), 0));

                loop {
                    match slots.keys().next().cloned() {
                        Some(key) if key < slot - 32 => slots.remove(&key),
                        _ => break,
                    };
                }
            },
        };
    }
}

async fn whirligig_subscribe<'a>(
    pubsub: &'a PubsubClient,
    addresses: &[Pubkey],
    commitment: ArgsCommitment,
) -> anyhow::Result<BoxStream<'a, (Pubkey, u64)>> {
    let mut streams = vec![];
    for address in addresses.iter().copied() {
        streams.push(
            pubsub
                .account_subscribe(
                    &address,
                    Some(RpcAccountInfoConfig {
                        encoding: Some(UiAccountEncoding::Binary),
                        data_slice: Some(UiDataSliceConfig {
                            offset: 0,
                            length: 0,
                        }),
                        commitment: Some(commitment.to_solana()),
                        min_context_slot: None,
                    }),
                )
                .await?
                .0
                .map(move |response| (address, response.context.slot))
                .boxed(),
        );
    }
    Ok(select_all(streams).boxed())
}

async fn grpc_subscribe_slots(
    grpc: String,
    grpc_x_token: Option<String>,
    commitment: ArgsCommitment,
) -> anyhow::Result<BoxStream<'static, u64>> {
    let mut endpoint = Channel::from_shared(grpc).context("failed to create gRPC channel")?;
    if endpoint.uri().scheme_str() == Some("https") {
        endpoint = endpoint.tls_config(ClientTlsConfig::new())?;
    }
    let channel = endpoint
        .connect()
        .await
        .context("failed to connect to gRPC")?;

    let x_token = match grpc_x_token {
        Some(x_token) => {
            let token: AsciiMetadataValue = x_token.try_into()?;
            anyhow::ensure!(!token.is_empty(), "InvalidXTokenLength({})", token.len());
            Some(token)
        }
        None => None,
    };

    let mut geyser = GeyserClient::with_interceptor(channel, |mut request: Request<()>| {
        if let Some(x_token) = x_token.clone() {
            request.metadata_mut().insert("x-token", x_token);
        }
        Ok(request)
    })
    .max_decoding_message_size(64 * 1024 * 1024);

    let (mut subscribe_tx, subscribe_rx) = mpsc::unbounded();
    subscribe_tx
        .send(SubscribeRequest {
            slots: hashmap! { "".to_owned() => SubscribeRequestFilterSlots {} },
            accounts: HashMap::new(),
            transactions: HashMap::new(),
            entry: HashMap::new(),
            blocks: HashMap::new(),
            blocks_meta: HashMap::new(),
            commitment: Some(commitment.to_proto()),
            accounts_data_slice: vec![],
        })
        .await?;

    let response: Response<Streaming<SubscribeUpdate>> = geyser
        .subscribe(subscribe_rx)
        .await
        .context("failed to subscribe to gRPC")?;
    Ok(response
        .into_inner()
        .filter_map(move |msg| async move {
            if let Ok(msg) = msg {
                match msg.update_oneof {
                    Some(UpdateOneof::Slot(msg)) => {
                        if msg.status == commitment.to_proto() {
                            Some(msg.slot)
                        } else {
                            None
                        }
                    }
                    Some(UpdateOneof::Ping(_msg)) => None,
                    _ => {
                        panic!("grpc: unexpected message {msg:?}");
                    }
                }
            } else {
                panic!("grpc: failed to get message {msg:?}");
            }
        })
        .boxed())
}
