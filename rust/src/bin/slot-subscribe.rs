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
    let ws_url = var("WS_URL")?;

    let pubsub = PubsubClient::new(ws_url.as_str()).await?;
    {
        let (mut stream, _unsubscribe) = pubsub.slot_subscribe2().await?;
        let mut ts = Instant::now();
        loop {
            match stream.next().await {
                Some(Ok(value)) => {
                    println!(
                        "{} {} {:.3} sec.",
                        Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
                        serde_json::to_string(&value).unwrap(),
                        ts.elapsed().as_millis() as f64 / 1000f64
                    );
                    ts = Instant::now();
                }
                Some(Err(error)) => {
                    eprintln!("stream error: {:?}", error)
                }
                None => break,
            }
        }
    }
    eprintln!(
        "stream finished, shutdown status: {:?}",
        pubsub.shutdown().await
    );

    Ok(())
}
