use {
    chrono::{SecondsFormat, Utc},
    dotenv::{dotenv, var},
    futures::stream::StreamExt,
    serde::Serialize,
    solana_account_decoder::{UiAccountData, UiAccountEncoding},
    solana_client::{nonblocking::pubsub_client::PubsubClient, rpc_config::RpcAccountInfoConfig},
    solana_sdk::{clock::Epoch, commitment_config::CommitmentConfig, pubkey::Pubkey},
    std::{str::FromStr, time::Instant},
};

// Serum | SOL-USDC
const ACCOUNT: &str = "9wFFyRfZBsuAha4YcuxcXLKwMxJR43S7fPfQLusDBzvT";

#[derive(Debug, Serialize)]
struct Account {
    lamports: u64,
    data: String,
    owner: String,
    executable: bool,
    rent_epoch: Epoch,
}

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
    while let Some(value) = stream.next().await {
        let account = Account {
            lamports: value.value.lamports,
            data: match value.value.data {
                UiAccountData::Binary(value, UiAccountEncoding::Base64) => value,
                _ => unreachable!("data should be base64"),
            },
            owner: value.value.owner,
            executable: value.value.executable,
            rent_epoch: value.value.rent_epoch,
        };

        println!(
            "{} {} {:.3} sec.\n",
            Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true),
            serde_json::to_string(&account).unwrap(),
            ts.elapsed().as_millis() as f64 / 1000f64
        );
        ts = Instant::now();
    }
    eprintln!("pubsub closed");

    Ok(())
}
