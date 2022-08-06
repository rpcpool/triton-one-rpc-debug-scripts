use {
    dotenv::{dotenv, var},
    futures::future::join_all,
    solana_cli_output::CliGossipNode,
    solana_client::{
        nonblocking::{
            quic_client::{QuicLazyInitializedEndpoint, QuicNewConnection},
            rpc_client::RpcClient,
        },
        tpu_connection::ClientStats,
    },
    std::{
        collections::{HashMap, HashSet},
        sync::Arc,
    },
};

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
                Some(vote_info.node_pubkey)
            } else {
                None
            }
        })
        .collect::<HashSet<_>>();

    let node_info = join_all(cluster_nodes.into_iter().filter_map(|node_info| {
        if vote_accounts_set.contains(&node_info.pubkey) {
            if let Some(mut quic_addr) = node_info.tpu {
                let endpoint = Arc::clone(&endpoint);
                quic_addr.set_port(quic_addr.port() + 6);
                let stats = ClientStats::default();
                return Some(async move {
                    let quic_err = QuicNewConnection::make_connection(endpoint, quic_addr, &stats)
                        .await
                        .err();
                    (CliGossipNode::new(node_info, &HashMap::new()), quic_err)
                });
            }
        }
        None
    }))
    .await;

    // Print nodes with QUIC OK
    print!(
        "IP Address      | Identity                                     | Gossip | TPU   | RPC Address           | Version | Feature Set    | QUIC\n\
         ----------------+----------------------------------------------+--------+-------+-----------------------+---------+----------------+-----\n",
    );
    let mut cnt = 0;
    for (node, _quic_err) in node_info.iter().filter(|(_, err)| err.is_none()) {
        cnt += 1;
        println!("{}| ok", node);
    }
    println!("Nodes: {}", cnt);
    println!();

    // Print nodes with QUIC error
    print!(
        "IP Address      | Identity                                     | Gossip | TPU   | RPC Address           | Version | Feature Set    | QUIC\n\
         ----------------+----------------------------------------------+--------+-------+-----------------------+---------+----------------+-----\n",
    );
    let mut cnt = 0;
    for (node, quic_err) in node_info.iter().filter(|(_, err)| err.is_some()) {
        cnt += 1;
        println!("{}| {:?}", node, quic_err.as_ref().unwrap())
    }
    println!("Nodes: {}", cnt);

    Ok(())
}
