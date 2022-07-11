use {
    chrono::{SecondsFormat, Utc},
    dotenv::{dotenv, var},
    futures::stream::StreamExt,
    solana_account_decoder::UiAccountEncoding,
    solana_client::{nonblocking::pubsub_client::PubsubClient, rpc_config::RpcAccountInfoConfig},
    solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey},
    std::{str::FromStr, time::Instant},
};

// Serum | SOL-USDC
const ACCOUNT: &str = "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv()?;
    let rpc_url = var("RPC_URL")?;

    let pubsub = PubsubClient::new(rpc_url.as_str()).await?;
    let (mut stream, _unsubscribe) = pubsub
        .account_subscribe(
            &Pubkey::from_str(ACCOUNT)?,
            Some(RpcAccountInfoConfig {
                encoding: Some(UiAccountEncoding::Base64),
                commitment: Some(CommitmentConfig::confirmed()),
                ..Default::default()
            }),
        )
        .await?;

    let mut ts = Instant::now();
    while let Some(_value) = stream.next().await {
        println!(
            "{} {:.3} sec.",
            Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
            ts.elapsed().as_millis() as f64 / 1000f64
        );
        ts = Instant::now();
    }
    eprintln!("pubsub closed");

    Ok(())
}
