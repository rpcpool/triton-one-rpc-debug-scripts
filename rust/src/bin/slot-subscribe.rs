use {
    chrono::{SecondsFormat, Utc},
    dotenv::{dotenv, var},
    futures::stream::StreamExt,
    solana_client::nonblocking::pubsub_client::PubsubClient,
    std::time::Instant,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv()?;
    let rpc_url = var("RPC_URL")?;

    let pubsub = PubsubClient::new(rpc_url.as_str()).await?;
    let (mut stream, _unsubscribe) = pubsub.slot_subscribe().await?;

    let mut ts = Instant::now();
    while let Some(value) = stream.next().await {
        println!(
            "{} {} {:.3} sec.",
            Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
            serde_json::to_string(&value).unwrap(),
            ts.elapsed().as_millis() as f64 / 1000f64
        );
        ts = Instant::now();
    }
    eprintln!("pubsub closed");

    Ok(())
}
