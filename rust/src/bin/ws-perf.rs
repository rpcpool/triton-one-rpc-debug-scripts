use {
    anyhow::Context,
    clap::{Parser, ValueEnum},
    futures::{
        channel::mpsc,
        sink::SinkExt,
        stream::{self, BoxStream, StreamExt},
    },
    maplit::hashmap,
    solana_client::{
        nonblocking::pubsub_client::PubsubClient,
        rpc_config::{RpcBlockSubscribeConfig, RpcBlockSubscribeFilter},
        rpc_response::SlotUpdate,
    },
    solana_sdk::commitment_config::CommitmentConfig,
    solana_transaction_status::{TransactionDetails, UiTransactionEncoding},
    std::{
        collections::{BTreeMap, HashMap},
        time::Instant,
    },
    tonic::{
        metadata::AsciiMetadataValue,
        transport::channel::{Channel, ClientTlsConfig},
        Request, Response, Streaming,
    },
    yellowstone_grpc_proto::prelude::{
        geyser_client::GeyserClient, subscribe_update::UpdateOneof, CommitmentLevel,
        SubscribeRequest, SubscribeRequestFilterBlocks, SubscribeRequestFilterSlots,
        SubscribeUpdate,
    },
};

#[derive(Parser, Debug)]
#[clap(author, version, about)]
struct Args {
    /// gRPC service endpoint
    #[clap(long, default_value_t = String::from("http://127.0.0.1:10000"))]
    grpc: String,
    /// Optional token for access to gRPC
    #[clap(long)]
    grpc_x_token: Option<String>,

    /// Whirligig service endpoing
    #[clap(long)]
    whirligig: Option<String>,

    /// Solana WebSocket endpoint
    #[clap(long, default_value_t = String::from("ws://127.0.0.1:8900"))]
    pubsub: String,

    /// Perf subscribe type
    #[clap(long)]
    perf: ArgsPerf,

    /// Commitment level
    #[clap(long)]
    commitment: ArgsCommitment,
}

impl Args {
    fn get_grpc_request(&self) -> SubscribeRequest {
        let (slots, blocks) = match self.perf {
            ArgsPerf::Slot => (
                hashmap! { "".to_owned() => SubscribeRequestFilterSlots {} },
                hashmap! {},
            ),
            ArgsPerf::Block => (
                hashmap! {},
                hashmap! { "".to_owned() => SubscribeRequestFilterBlocks {
                    account_include: vec![],
                    include_transactions: Some(true),
                    include_accounts: None,
                    include_entries: None,
                } },
            ),
        };

        SubscribeRequest {
            slots,
            accounts: HashMap::new(),
            transactions: HashMap::new(),
            entry: HashMap::new(),
            blocks,
            blocks_meta: HashMap::new(),
            commitment: Some(self.commitment.to_proto()),
            accounts_data_slice: vec![],
        }
    }

    async fn subscribe_ws<'a>(
        &self,
        client: &'a PubsubClient,
        source: Source,
    ) -> anyhow::Result<BoxStream<'a, u64>> {
        Ok(match self.perf {
            ArgsPerf::Slot => {
                let (stream, _unsubscribe) = client
                    .slot_updates_subscribe()
                    .await
                    .with_context(|| format!("failed to subscribe to {source:?}"))?;
                let commitment = self.commitment;
                stream
                    .filter_map(move |slot_update| async move {
                        match (commitment, slot_update) {
                            (ArgsCommitment::Processed, SlotUpdate::Frozen { slot, .. }) => {
                                Some(slot)
                            }
                            (
                                ArgsCommitment::Confirmed,
                                SlotUpdate::OptimisticConfirmation { slot, .. },
                            ) => Some(slot),
                            (ArgsCommitment::Finalized, SlotUpdate::Root { slot, .. }) => {
                                Some(slot)
                            }
                            _ => None,
                        }
                    })
                    .boxed()
            }
            ArgsPerf::Block => {
                let (stream, _unsubscribe) = client
                    .block_subscribe(
                        RpcBlockSubscribeFilter::All,
                        Some(RpcBlockSubscribeConfig {
                            commitment: Some(match self.commitment {
                                ArgsCommitment::Processed => CommitmentConfig::processed(),
                                ArgsCommitment::Confirmed => CommitmentConfig::confirmed(),
                                ArgsCommitment::Finalized => CommitmentConfig::finalized(),
                            }),
                            encoding: Some(UiTransactionEncoding::Base64),
                            transaction_details: Some(TransactionDetails::Full),
                            show_rewards: Some(true),
                            max_supported_transaction_version: Some(u8::MAX),
                        }),
                    )
                    .await
                    .with_context(|| format!("failed to subscribe to {source:?}"))?;
                stream.map(|response| response.value.slot).boxed()
            }
        })
    }
}

#[derive(Debug, Clone, Copy, ValueEnum)]
enum ArgsPerf {
    Slot,
    Block,
}

#[derive(Debug, Clone, Copy, ValueEnum)]
enum ArgsCommitment {
    Processed,
    Confirmed,
    Finalized,
}

impl ArgsCommitment {
    const fn to_proto(self) -> i32 {
        (match self {
            Self::Processed => CommitmentLevel::Processed,
            Self::Confirmed => CommitmentLevel::Confirmed,
            Self::Finalized => CommitmentLevel::Finalized,
        }) as i32
    }
}

#[derive(Debug)]
enum Source {
    Grpc,
    Whirligig,
    Pubsub,
}

#[derive(Debug, Default)]
struct SlotTime {
    grpc: Option<Instant>,
    whirligig: Option<Instant>,
    pubsub: Option<Instant>,
}

impl SlotTime {
    fn set_time(&mut self, source: Source, slot: u64, whirligig_required: bool) {
        *(match source {
            Source::Grpc => &mut self.grpc,
            Source::Whirligig => &mut self.whirligig,
            Source::Pubsub => &mut self.pubsub,
        }) = Some(Instant::now());

        if whirligig_required {
            if let (Some(grpc), Some(whirligig), Some(pubsub)) =
                (self.grpc, self.whirligig, self.pubsub)
            {
                let zero = grpc.min(whirligig).min(pubsub);
                let grpc = (grpc - zero).as_micros() as f64 / 1000f64;
                let whirligig = (whirligig - zero).as_micros() as f64 / 1000f64;
                let pubsub = (pubsub - zero).as_micros() as f64 / 1000f64;
                println!(
                    "#{slot}\tgrpc +{:0>8.3}ms\twhirligig +{:0>8.3}ms\tpubsub +{:0>8.3}ms",
                    grpc, whirligig, pubsub
                );
            }
        } else if let (Some(grpc), Some(pubsub)) = (self.grpc, self.pubsub) {
            let zero = grpc.min(pubsub);
            let grpc = (grpc - zero).as_micros() as f64 / 1000f64;
            let pubsub = (pubsub - zero).as_micros() as f64 / 1000f64;
            println!(
                "#{slot}\tgrpc +{:0>8.3}ms\tpubsub +{:0>8.3}ms",
                grpc, pubsub
            );
        }
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    // Geyser gRPC
    let mut grpc = connect_grpc(
        args.grpc.clone(),
        args.grpc_x_token.clone(),
        args.get_grpc_request(),
        args.commitment,
    )
    .await?;

    // whirligig
    let client = match &args.whirligig {
        Some(endpoint) => Some(
            PubsubClient::new(endpoint)
                .await
                .context("failed to connect to whirligig")?,
        ),
        None => None,
    };
    let mut whirligig = match &client {
        Some(client) => args.subscribe_ws(client, Source::Whirligig).await?,
        None => stream::pending().boxed(),
    };

    // pubsub
    let client = PubsubClient::new(&args.pubsub)
        .await
        .context("failed to connect to pubsub")?;
    let mut pubsub = args.subscribe_ws(&client, Source::Pubsub).await?;

    // perf loop
    let mut slots: BTreeMap<u64, SlotTime> = BTreeMap::new();
    loop {
        let (maybe_slot, source) = tokio::select! {
            msg = grpc.next() => (msg, Source::Grpc),
            msg = whirligig.next() => (msg, Source::Whirligig),
            msg = pubsub.next() => (msg, Source::Pubsub),
        };
        let slot = if let Some(slot) = maybe_slot {
            slot
        } else {
            panic!("{source:?}: stream finished");
        };
        loop {
            match slots.keys().next().cloned() {
                Some(key) if key < slot - 32 => slots.remove(&key),
                _ => break,
            };
        }
        slots
            .entry(slot)
            .or_default()
            .set_time(source, slot, args.whirligig.is_some());
    }
}

async fn connect_grpc(
    grpc: String,
    grpc_x_token: Option<String>,
    request: SubscribeRequest,
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
    subscribe_tx.send(request).await?;

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
                    Some(UpdateOneof::Block(msg)) => Some(msg.slot),
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
