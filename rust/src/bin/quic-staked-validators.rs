use {
    dotenv::{dotenv, var},
    futures::future::join_all,
    solana_client::{
        nonblocking::{
            quic_client::{QuicLazyInitializedEndpoint, QuicNewConnection},
            rpc_client::RpcClient,
        },
        tpu_connection::ClientStats,
    },
    std::{collections::HashMap, fmt, sync::Arc},
    tokio::sync::Semaphore,
};

#[derive(Debug)]
struct NodeInfo {
    ip_address: Option<String>,
    identity: String,
    version: Option<String>,
    activated_stake: u64,
    quic_err: Option<String>,
}

struct VecNodeInfo(Vec<NodeInfo>);

impl fmt::Display for VecNodeInfo {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        writeln!(f, "IP Address      | Identity                                     | Version | Active Stake         | QUIC OK?")?;
        writeln!(f, "----------------+----------------------------------------------+---------+----------------------+---------")?;
        for node in self.0.iter() {
            writeln!(
                f,
                "{:15} | {:44} | {:8}| {:20} | {}",
                node.ip_address.as_deref().unwrap_or("none"),
                node.identity,
                node.version.as_deref().unwrap_or("unknown"),
                node.activated_stake,
                node.quic_err.as_deref().unwrap_or("ok")
            )?;
        }
        write!(f, "Nodes: {}", self.0.len())
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv()?;
    let rpc_url = var("RPC_URL")?;
    let endpoint = Arc::new(QuicLazyInitializedEndpoint::default());

    let rpc = RpcClient::new(rpc_url);
    let (vote_accounts, cluster_nodes) =
        tokio::try_join!(rpc.get_vote_accounts(), rpc.get_cluster_nodes())?;

    let vote_accounts_set = vote_accounts
        .current
        .into_iter()
        .filter_map(|vote_info| {
            if vote_info.activated_stake > 0 {
                Some((vote_info.node_pubkey, vote_info.activated_stake))
            } else {
                None
            }
        })
        .collect::<HashMap<_, _>>();

    let semaphore = Arc::new(Semaphore::new(100));
    let nodes = join_all(cluster_nodes.into_iter().filter_map(|node_info| {
        if let Some(activated_stake) = vote_accounts_set.get(&node_info.pubkey).cloned() {
            if let Some(mut quic_addr) = node_info.tpu {
                let semaphore = Arc::clone(&semaphore);
                let endpoint = Arc::clone(&endpoint);
                quic_addr.set_port(quic_addr.port() + 6);
                let stats = ClientStats::default();
                return Some(async move {
                    let _lock = semaphore.acquire().await.expect("alive semaphore");
                    let quic_err = QuicNewConnection::make_connection(endpoint, quic_addr, &stats)
                        .await
                        .err()
                        .map(|error| error.to_string());
                    NodeInfo {
                        ip_address: node_info.gossip.map(|addr| addr.ip().to_string()),
                        identity: node_info.pubkey,
                        version: node_info.version,
                        activated_stake,
                        quic_err,
                    }
                });
            }
        }
        None
    }))
    .await;

    let mut nodes_ok = vec![];
    let mut nodes_err = vec![];
    for node in nodes.into_iter() {
        if node.quic_err.is_some() {
            &mut nodes_err
        } else {
            &mut nodes_ok
        }
        .push(node);
    }
    nodes_ok.sort_by(|a, b| a.activated_stake.cmp(&b.activated_stake).reverse());
    nodes_err.sort_by(|a, b| a.activated_stake.cmp(&b.activated_stake).reverse());

    println!("{}", VecNodeInfo(nodes_ok));
    println!();
    println!("{}", VecNodeInfo(nodes_err));

    Ok(())
}
