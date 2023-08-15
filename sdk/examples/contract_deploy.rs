use anyhow::{anyhow, bail, Context};
use clap::Parser;
use cml_chain::address::{Address, EnterpriseAddress};
use cml_chain::assets::MultiAsset;
use cml_chain::builders::input_builder::{InputBuilderResult, SingleInputBuilder};
use cml_chain::builders::output_builder::TransactionOutputBuilder;
use cml_chain::builders::tx_builder::{
    ChangeSelectionAlgo, TransactionBuilder, TransactionBuilderConfigBuilder,
};
use cml_chain::builders::witness_builder::{PartialPlutusWitness, PlutusScriptWitness};
use cml_chain::certs::StakeCredential;
use cml_chain::crypto::hash::hash_transaction;
use cml_chain::crypto::utils::make_vkey_witness;
use cml_chain::fees::LinearFee;
use cml_chain::plutus::PlutusScript::PlutusV2;
use cml_chain::plutus::{
    ConstrPlutusData, CostModels, ExUnitPrices, Language, PlutusData, PlutusScript, PlutusV2Script,
};
use cml_chain::transaction::{
    DatumOption, RequiredSigners, Transaction, TransactionInput, TransactionOutput,
    TransactionWitnessSet,
};
use cml_chain::utils::BigInt;
use cml_chain::{AssetName, PolicyId, Rational, UnitInterval, Value};
use cml_core::ordered_hash_map::OrderedHashMap;
use cml_core::serialization::{FromBytes, Serialize, ToBytes};
use cml_core::{Int, Slot};
use cml_crypto::{
    blake2b256, Bip32PrivateKey, DatumHash, PrivateKey, PublicKey, RawBytesEncoding, ScriptHash,
    TransactionHash,
};
use projected_nft_structs::{Owner, State, Status, StatusUnlocking};
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{header, Client, StatusCode};
use serde::de::Error;
use serde::{Deserialize, Deserializer, Serialize as SerdeSerialize, Serializer};
use std::fmt;
use std::fs::File;
use std::hash::Hash;
use std::io::{Cursor, Read};
use std::path::PathBuf;
use std::str::FromStr;

#[derive(Parser)]
pub struct CommandLine {
    #[clap(subcommand)]
    command: Command,
    #[clap(long, value_parser)]
    blockfrost: PathBuf,
    #[arg(long)]
    submit: bool,
}

#[derive(Parser)]
pub enum Command {
    Empty,
    LockNft(ConfigPath),
    UnlockNft(ConfigPath),
}

#[derive(Parser)]
pub struct ConfigPath {
    config: PathBuf,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct LockNftConfiguration {
    pub payment_bech32: Option<String>,
    pub payment_vkey: Option<PathBuf>,

    pub payment_skey: Option<PathBuf>,
    pub payment_mnemonics: Option<PathBuf>,

    pub inputs: Vec<UtxoPointer>,
    pub collateral: UtxoPointer,

    pub lock_on: String,

    pub lock_ada: u64,
    pub nft_policy_id_hex: String,
    pub nft_asset_name: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct UnlockNftConfiguration {
    pub payment_bech32: Option<String>,
    pub payment_vkey: Option<PathBuf>,

    pub payment_skey: Option<PathBuf>,
    pub payment_mnemonics: Option<PathBuf>,

    pub inputs: Vec<UtxoPointer>,
    pub collateral: UtxoPointer,
    pub locked: UtxoPointer,

    pub locked_on: String,
    pub ttl: u64,
}

#[tokio::main]
pub async fn main() -> anyhow::Result<()> {
    let CommandLine {
        command,
        blockfrost,
        submit,
    } = CommandLine::parse();

    let config: BlockfrostConfiguration = serde_yaml::from_reader(
        File::open(blockfrost).context("failed to open the blockfrost config file")?,
    )?;

    match command {
        Command::Empty => {
            println!("Params:\nblockfrost: {:?}\nsubmit: {}", config, submit);
            Ok(())
        }

        Command::LockNft(params) => handle_lock_nft(params, config, submit).await,
        Command::UnlockNft(params) => handle_unlock_nft(params, config, submit).await,
    }
}

async fn handle_lock_nft(
    config: ConfigPath,
    blockfrost: BlockfrostConfiguration,
    submit: bool,
) -> anyhow::Result<()> {
    let config: LockNftConfiguration = serde_yaml::from_reader(
        File::open(config.config).context("failed to open the delegate rewards config file")?,
    )?;

    let network = blockfrost.get_network();
    println!("Network:\t{network}");

    let payment_address = get_payment_creds(network, config.payment_vkey, config.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let mut builder = create_tx_builder_plutus(true);

    let blockfrost = Blockfrost::new(blockfrost)?;
    let (inputs_value, inputs) = fetch_inputs(config.inputs, &blockfrost, &payment_address).await?;
    for input in inputs {
        builder
            .add_input(input)
            .map_err(|err| anyhow!("Can't add input: {err}"))?;
    }

    let (collateral, collateral_inputs) =
        fetch_inputs(vec![config.collateral], &blockfrost, &payment_address).await?;
    builder
        .add_collateral(
            collateral_inputs
                .first()
                .cloned()
                .ok_or(anyhow!("No collateral provided"))?,
        )
        .map_err(|err| anyhow!("Can't add collateral: {err}"))?;
    builder.set_collateral_return(TransactionOutput::new(
        payment_address.clone(),
        collateral.checked_sub(&Value::from(4000000))?,
        None,
        None,
    ));

    let contract = PlutusV2Script::from_bytes(
        hex::decode(config.lock_on).map_err(|err| anyhow!("Can't decode contract hex {err}"))?,
    )
    .map_err(|err| anyhow!("Can't decode PlutusV2 contract {err}"))?;
    let lock_on =
        EnterpriseAddress::new(network, StakeCredential::new_script(contract.hash())).to_address();
    println!("Lock on contract: {}", lock_on.to_bech32(None).unwrap());

    let nft_value = {
        let mut nft_multiasset = MultiAsset::new();
        let mut assets = OrderedHashMap::new();
        assets.insert(
            AssetName::new(config.nft_asset_name.as_bytes().to_vec())
                .map_err(|err| anyhow!("Can't decode asset name: {err:?}"))?,
            1,
        );

        nft_multiasset.insert(
            PolicyId::from_hex(&config.nft_policy_id_hex)
                .map_err(|err| anyhow!("Can't decode policy: {err:?}"))?,
            assets,
        );

        Value::new(config.lock_ada, nft_multiasset)
    };

    let datum = State::new(
        Owner::new_public_keyhash(match payment_address.payment_cred().cloned().unwrap() {
            StakeCredential::PubKey { hash, .. } => hash,
            _ => {
                return Err(anyhow!(
                    "ScriptHash is not supported as the owner of locked nft"
                ));
            }
        }),
        Status::new_locked(),
    );

    builder
        .add_output(
            TransactionOutputBuilder::new()
                .with_address(lock_on)
                .with_data(DatumOption::new_datum(
                    PlutusData::from_bytes(datum.to_canonical_cbor_bytes()).unwrap(),
                ))
                .next()
                .unwrap()
                .with_value(nft_value)
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    let mut signed_tx_builder = builder
        .build(ChangeSelectionAlgo::Default, &payment_address)
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;
    let body = signed_tx_builder.body();

    if config.payment_skey.is_none() && config.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs);
        println!("outputs {:?}", body.outputs);
        println!("collateral {:?}", body.collateral_inputs);
        println!("collateral return {:?}", body.collateral_return);
        println!("fee {:?}", body.fee);

        println!(
            "body: {}",
            hex::encode(
                Transaction::new(body, TransactionWitnessSet::new(), true, None).to_cbor_bytes()
            )
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_skey, config.payment_mnemonics)?;

    signed_tx_builder.add_vkey(make_vkey_witness(
        &hash_transaction(&body),
        &payment_address_sk,
    ));

    let tx = signed_tx_builder
        .build_checked()
        .map_err(|err| anyhow!("Can't build tx: {err}"))?;

    println!("inputs {:?}", body.inputs);
    println!("outputs {:?}", body.outputs);
    println!("collateral {:?}", body.collateral_inputs);
    println!("collateral return {:?}", body.collateral_return);
    println!("fee {:?}", body.fee);

    finalize_and_submit_tx(tx, blockfrost, submit).await
}

async fn handle_unlock_nft(
    config: ConfigPath,
    blockfrost: BlockfrostConfiguration,
    submit: bool,
) -> anyhow::Result<()> {
    let config: UnlockNftConfiguration = serde_yaml::from_reader(
        File::open(config.config).context("failed to open the delegate rewards config file")?,
    )?;

    let network = blockfrost.get_network();
    println!("Network:\t{network}");

    let payment_address = get_payment_creds(network, config.payment_vkey, config.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let contract = PlutusV2Script::from_bytes(
        hex::decode(config.locked_on).map_err(|err| anyhow!("Can't decode contract hex {err}"))?,
    )
    .map_err(|err| anyhow!("Can't decode PlutusV2 contract {err}"))?;
    let lock_on =
        EnterpriseAddress::new(network, StakeCredential::new_script(contract.hash())).to_address();
    println!("Locked on contract: {}", lock_on.to_bech32(None).unwrap());

    let mut builder = create_tx_builder_plutus(true);

    let blockfrost = Blockfrost::new(blockfrost)?;
    let (inputs_value, inputs) = fetch_inputs(config.inputs, &blockfrost, &payment_address).await?;
    for input in inputs {
        builder
            .add_input(input)
            .map_err(|err| anyhow!("Can't add input: {err}"))?;
    }

    let locked_balance = blockfrost
        .get_utxo_info(config.locked.hash.to_string(), config.locked.index)
        .await?
        .into_iter()
        .map(Value::from)
        .fold(Value::zero(), |acc, new| acc.checked_add(&new).unwrap());

    let mut signers = RequiredSigners::new();
    signers.push(match payment_address.payment_cred().cloned().unwrap() {
        StakeCredential::PubKey { hash, .. } => hash,
        StakeCredential::Script { .. } => {
            return Err(anyhow!("doesn't work"));
        }
    });
    let datum = State::new(
        Owner::new_public_keyhash(match payment_address.payment_cred().cloned().unwrap() {
            StakeCredential::PubKey { hash, .. } => hash,
            _ => {
                return Err(anyhow!(
                    "ScriptHash is not supported as the owner of locked nft"
                ))
            }
        }),
        Status::new_locked(),
    );
    let plutus_data = PlutusData::from_bytes(datum.to_canonical_cbor_bytes()).unwrap();
    let partial_witness = PartialPlutusWitness::new(
        PlutusScriptWitness::Script(PlutusV2(contract)),
        plutus_data.clone(),
    );

    builder
        .add_input(
            SingleInputBuilder::new(
                TransactionInput::new(config.locked.hash.clone(), config.locked.index),
                TransactionOutput::new(
                    lock_on.clone(),
                    locked_balance.clone(),
                    Some(DatumOption::new_datum(plutus_data.clone())),
                    None,
                ),
            )
            .plutus_script(partial_witness, signers, plutus_data)
            .unwrap(),
        )
        .unwrap();

    let (collateral, collateral_inputs) =
        fetch_inputs(vec![config.collateral], &blockfrost, &payment_address).await?;
    builder
        .add_collateral(
            collateral_inputs
                .first()
                .cloned()
                .ok_or(anyhow!("No collateral provided"))?,
        )
        .map_err(|err| anyhow!("Can't add collateral: {err}"))?;
    builder.set_collateral_return(TransactionOutput::new(
        payment_address.clone(),
        collateral.checked_sub(&Value::from(4000000))?,
        None,
        None,
    ));

    let ttl = config.ttl;

    builder.set_ttl(Slot::from(ttl));
    let datum = State::new(
        Owner::new_public_keyhash(match payment_address.payment_cred().cloned().unwrap() {
            StakeCredential::PubKey { hash, .. } => hash,
            _ => {
                return Err(anyhow!(
                    "ScriptHash is not supported as the owner of locked nft"
                ))
            }
        }),
        Status::new_unlocking(StatusUnlocking::new(
            TransactionInput::new(config.locked.hash, config.locked.index),
            ttl as i64 + 300,
        )),
    );
    let datum_byes = datum.to_cbor_bytes();
    println!("hex: {}", hex::encode(datum_byes.clone()));
    builder
        .add_output(
            TransactionOutputBuilder::new()
                .with_address(lock_on)
                .with_data(DatumOption::new_datum(
                    PlutusData::from_bytes(datum_byes).unwrap(),
                ))
                .next()
                .unwrap()
                .with_value(locked_balance)
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    let mut signed_tx_builder = builder
        .build(ChangeSelectionAlgo::Default, &payment_address)
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;
    let body = signed_tx_builder.body();

    if config.payment_skey.is_none() && config.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs);
        println!("outputs {:?}", body.outputs);
        println!("collateral {:?}", body.collateral_inputs);
        println!("collateral return {:?}", body.collateral_return);
        println!("fee {:?}", body.fee);

        println!(
            "body: {}",
            hex::encode(
                Transaction::new(body, TransactionWitnessSet::new(), true, None).to_cbor_bytes()
            )
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_skey, config.payment_mnemonics)?;

    signed_tx_builder.add_vkey(make_vkey_witness(
        &hash_transaction(&body),
        &payment_address_sk,
    ));

    let tx = signed_tx_builder
        .build_checked()
        .map_err(|err| anyhow!("Can't build tx: {err}"))?;

    println!("inputs {:?}", body.inputs);
    println!("outputs {:?}", body.outputs);
    println!("collateral {:?}", body.collateral_inputs);
    println!("collateral return {:?}", body.collateral_return);
    println!("fee {:?}", body.fee);

    finalize_and_submit_tx(tx, blockfrost, submit).await
}

pub async fn finalize_and_submit_tx(
    final_tx: Transaction,
    blockfrost: Blockfrost,
    submit: bool,
) -> anyhow::Result<()> {
    println!("Final tx: {}", hex::encode(final_tx.to_cbor_bytes()));

    if submit {
        println!(
            "Submitted tx: {:?}",
            blockfrost.v0_tx_submit(&final_tx).await??.to_hex()
        );
    }

    Ok(())
}

pub async fn fetch_inputs(
    inputs: Vec<UtxoPointer>,
    blockfrost: &Blockfrost,
    payment_address: &Address,
) -> anyhow::Result<(Value, Vec<InputBuilderResult>)> {
    let mut total_input = Value::new(0, MultiAsset::new());
    let mut input_builders = vec![];
    for input in inputs {
        let utxo_balance = blockfrost
            .get_utxo_info(input.hash.to_string(), input.index)
            .await?
            .into_iter()
            .map(Value::from)
            .fold(Value::zero(), |acc, new| acc.checked_add(&new).unwrap());

        input_builders.push(
            SingleInputBuilder::new(
                TransactionInput::new(input.hash, input.index),
                TransactionOutput::new(payment_address.clone(), utxo_balance.clone(), None, None),
            )
            .payment_key()
            .map_err(|err| anyhow!("Can't create tx input: {err:?}"))?,
        );

        total_input = total_input.checked_add(&utxo_balance).unwrap();
    }

    Ok((total_input, input_builders))
}

pub fn create_tx_builder_plutus(include_plutus: bool) -> TransactionBuilder {
    let mut config = TransactionBuilderConfigBuilder::new()
        .max_tx_size(16384)
        .max_collateral_inputs(3)
        .collateral_percentage(150)
        .coins_per_utxo_byte(4310)
        .key_deposit(2000000)
        .pool_deposit(500000000)
        .max_value_size(5000)
        .ex_unit_prices(ExUnitPrices::new(
            Rational::new(577, 10000),
            Rational::new(721, 10000000),
        ))
        .fee_algo(LinearFee::new(44, 155381));
    if include_plutus {
        let vasil_v2 = vec![
            205665, 812, 1, 1, 1000, 571, 0, 1, 1000, 24177, 4, 1, 1000, 32, 117366, 10475, 4,
            23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 23000, 100, 100, 100,
            23000, 100, 19537, 32, 175354, 32, 46417, 4, 221973, 511, 0, 1, 89141, 32, 497525,
            14068, 4, 2, 196500, 453240, 220, 0, 1, 1, 1000, 28662, 4, 2, 245000, 216773, 62, 1,
            1060367, 12586, 1, 208512, 421, 1, 187000, 1000, 52998, 1, 80436, 32, 43249, 32, 1000,
            32, 80556, 1, 57667, 4, 1000, 10, 197145, 156, 1, 197145, 156, 1, 204924, 473, 1,
            208896, 511, 1, 52467, 32, 64832, 32, 65493, 32, 22558, 32, 16563, 32, 76511, 32,
            196500, 453240, 220, 0, 1, 1, 69522, 11687, 0, 1, 60091, 32, 196500, 453240, 220, 0, 1,
            1, 196500, 453240, 220, 0, 1, 1, 1159724, 392670, 0, 2, 806990, 30482, 4, 1927926,
            82523, 4, 265318, 0, 4, 0, 85931, 32, 205665, 812, 1, 1, 41182, 32, 212342, 32, 31220,
            32, 32696, 32, 43357, 32, 32247, 32, 38314, 32, 35892428, 10, 57996947, 18975, 10,
            38887044, 32947, 10,
        ]
        .into_iter()
        .map(|integer| Int::new_uint(integer))
        .collect::<Vec<Int>>();

        let costmodels = CostModels {
            plutus_v1: None,
            plutus_v2: Some(vasil_v2),
            encodings: None,
        };

        config = config.cost_models(costmodels);
    }

    let config = config.build().unwrap();

    TransactionBuilder::new(config)
}

#[derive(Clone, Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct BlockfrostConfiguration {
    pub endpoint: String,
    pub key: String,
}

#[derive(Deserialize, Debug)]
struct TxUtxos {
    outputs: Vec<TxOutput>,
}

#[derive(Deserialize, Debug)]
struct TxOutput {
    amount: Vec<AssetAmount>,
}

#[derive(Deserialize, Debug)]
pub struct AssetAmount {
    pub unit: String,
    pub quantity: String,
}

pub struct Blockfrost {
    config: BlockfrostConfiguration,
    client: Client,
}

impl BlockfrostConfiguration {
    pub fn get_network(&self) -> u8 {
        if self.endpoint.contains("preprod") || self.endpoint.contains("preview") {
            0
        } else {
            1
        }
    }
}

impl Blockfrost {
    pub fn new(config: BlockfrostConfiguration) -> anyhow::Result<Self> {
        let mut headers = HeaderMap::new();
        headers.append(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/cbor"),
        );
        headers.append(
            "project_id",
            HeaderValue::from_str(&config.key).map_err(|err| {
                anyhow!("The project_id (authentication key) is not in a valid format {err:?}")
            })?,
        );

        let client = reqwest::Client::builder()
            .default_headers(headers)
            .build()
            .map_err(|err| anyhow!("Failed to build HTTP Client {err:?}"))?;

        Ok(Self { config, client })
    }

    pub async fn get_utxo_info(
        &self,
        tx_id: String,
        index: u64,
    ) -> anyhow::Result<Vec<AssetAmount>> {
        let req = self
            .client
            .get(self.url(format!("api/v0/txs/{tx_id}/utxos")))
            .send()
            .await
            .context("Failed to get utxos for transaction")?;

        match req.status() {
            StatusCode::OK => {
                let mut payload = req
                    .json::<TxUtxos>()
                    .await
                    .context("Request response is not json")?;

                Ok(payload.outputs.swap_remove(index as usize).amount)
            }
            StatusCode::NOT_FOUND => bail!("transaction not found"),
            _ => {
                let error: BlockFrostError =
                    req.json().await.context("expected error to be decoded")?;

                bail!(
                    "{error}: {message}",
                    error = error.error,
                    message = error.message
                )
            }
        }
    }

    fn url(&self, api: impl fmt::Display) -> String {
        format!(
            "{endpoint}/{api}",
            endpoint = self.config.endpoint,
            api = api
        )
    }

    pub async fn v0_tx_submit(
        &self,
        transaction: &Transaction,
    ) -> anyhow::Result<anyhow::Result<TransactionHash>> {
        let bytes = transaction.to_cbor_bytes();
        let req = self
            .client
            .post(self.url("api/v0/tx/submit"))
            .body(bytes)
            .send()
            .await
            .map_err(|err| {
                anyhow!("Failed to submit transaction to blockfrost endpoint: {err:?}")
            })?;

        if req.status() == StatusCode::OK {
            let bf_id: String = req.json().await.map_err(|err|
                anyhow!("Expect the end point to return confirmation about the transaction being submitted {err:?}")
            )?;

            TransactionHash::from_raw_bytes(
                &hex::decode(bf_id)
                    .map_err(|err| anyhow!("Blockfrost should return an ID: {err:?}"))?,
            )
            .map_err(|error| anyhow!("Failed to decode expected transaction id: {error}"))
            .map(Ok)
        } else {
            let error: BlockFrostError = req
                .json()
                .await
                .map_err(|err| anyhow!("expected error to be decoded, {err:?}"))?;

            Ok(Err(anyhow!("{}: {}", error.error, error.message)))
        }
    }
}

#[derive(Deserialize)]
struct BlockFrostError {
    error: String,
    message: String,
}

#[derive(Clone, Debug)]
pub struct UtxoPointer {
    pub hash: TransactionHash,
    pub index: u64,
}

impl SerdeSerialize for UtxoPointer {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl<'de> Deserialize<'de> for UtxoPointer {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = Deserialize::deserialize(deserializer)?;
        // do better hex decoding than this
        UtxoPointer::from_str(&s).map_err(|err| D::Error::custom(err.to_string()))
    }
}

impl std::str::FromStr for UtxoPointer {
    type Err = anyhow::Error;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let (hash, index) = s.split_once('@').ok_or_else(|| {
            anyhow!("UtxoPointer should be formatted as `<hex hash> '@' <index>`")
        })?;

        let hash =
            TransactionHash::from_raw_bytes(&hex::decode(hash).context("Invalid Hash format")?)
                .map_err(|error| anyhow!("Invalid hash format: {}", error))?;

        let index = u64::from_str(index).context("Invalid index format")?;

        Ok(UtxoPointer { hash, index })
    }
}

impl ToString for UtxoPointer {
    fn to_string(&self) -> String {
        format!("{}@{}", self.hash.to_hex(), self.index)
    }
}

pub fn parse_asset(asset: &str) -> anyhow::Result<(ScriptHash, AssetName)> {
    let asset = hex::decode(asset).map_err(|_| anyhow!("expected asset in hex"))?;
    let policy_id = asset[0..28].to_vec();
    let asset_name = asset[28..].to_vec();
    let asset_name = AssetName::new(asset_name).map_err(|_| anyhow!("invalid asset name"))?;
    let policy_id =
        PolicyId::from_raw_bytes(&policy_id).map_err(|_| anyhow!("invalid policy id"))?;
    Ok((policy_id, asset_name))
}

impl From<AssetAmount> for Value {
    fn from(value: AssetAmount) -> Self {
        if value.unit == "lovelace" {
            Value::new(u64::from_str(&value.quantity).unwrap(), MultiAsset::new())
        } else {
            let mut ma = MultiAsset::new();

            let (policy_id, asset_name) = parse_asset(&value.unit).unwrap();

            let mut assets = OrderedHashMap::<AssetName, u64>::new();
            assets.insert(asset_name, u64::from_str(&value.quantity).unwrap());
            ma.insert(policy_id, assets);

            Value::new(0, ma)
        }
    }
}

pub fn get_signing_creds(
    skey: Option<PathBuf>,
    mnemonics: Option<PathBuf>,
) -> anyhow::Result<PrivateKey> {
    if let Some(payment_address_sk) = skey {
        let payment_address_sk = Key::from_path(payment_address_sk)?;
        assert!(matches!(
            payment_address_sk,
            Key::PaymentSigningKeyShelley { .. }
        ));
        payment_address_sk.private_key()
    } else if let Some(mnemonics_path) = mnemonics {
        let mut buf = vec![];
        File::open(mnemonics_path)
            .map_err(|err| anyhow!("No mnemonics file found: {err}"))?
            .read_to_end(&mut buf)?;
        let mnemonics =
            String::from_utf8(buf).map_err(|err| anyhow!("Can't parse mnemonics {err}"))?;
        let root_key = get_root_key(&mnemonics)?;
        let key = root_key.derive(EXTERNAL).derive(0);
        Ok(key.to_raw_key())
    } else {
        Err(anyhow!("No payment signing credentials provided"))
    }
}

pub const HARD_DERIVATION_START: u32 = 0x80000000;
pub const PURPOSE: u32 = HARD_DERIVATION_START + 1852;
pub const COIN_TYPE: u32 = HARD_DERIVATION_START + 1815;
pub const DEFAULT_ACCOUNT: u32 = HARD_DERIVATION_START;
pub const EXTERNAL: u32 = 0;

pub fn get_root_key(mnemonic: &str) -> Result<Bip32PrivateKey, anyhow::Error> {
    let mnemonic: bip39::Mnemonic = mnemonic.parse().context("invalid mnemonics")?;
    let root_key = Bip32PrivateKey::from_bip39_entropy(&mnemonic.to_entropy(), &[])
        .derive(PURPOSE)
        .derive(COIN_TYPE)
        .derive(DEFAULT_ACCOUNT);

    Ok(root_key)
}

pub fn get_payment_creds(
    network: u8,
    vkey: Option<PathBuf>,
    bech32: Option<String>,
) -> anyhow::Result<Address> {
    if let Some(vkey) = vkey {
        let payment_address = Key::from_path(vkey)?;
        assert!(matches!(
            payment_address,
            Key::PaymentVerificationKeyShelley { .. }
        ));
        let payment_address_pk = payment_address.public_key()?;
        Ok(EnterpriseAddress::new(
            network,
            StakeCredential::new_pub_key(payment_address_pk.hash()),
        )
        .to_address())
    } else if let Some(pk) = bech32 {
        Ok(Address::from_bech32(&pk).map_err(|err| anyhow!("Can't parse bech32 pk: {err}"))?)
    } else {
        Err(anyhow!("No payment key provided"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[allow(clippy::enum_variant_names)]
pub enum Key {
    #[serde(rename = "StakePoolVerificationKey_ed25519")]
    StakePoolVerificationKey(StakePoolVerificationKey),
    #[serde(rename = "StakePoolSigningKey_ed25519")]
    StakePoolSigningKey(StakePoolSigningKey),
    #[serde(rename = "StakeVerificationKeyShelley_ed25519")]
    StakeVerificationKeyShelley(StakeVerificationKeyShelley),
    #[serde(rename = "StakeSigningKeyShelley_ed25519")]
    StakeSigningKeyShelley(StakeSigningKeyShelley),
    #[serde(rename = "VrfVerificationKey_PraosVRF")]
    VrfVerificationKey(VrfVerificationKey),
    #[serde(rename = "VrfSigningKey_PraosVRF")]
    VrfSigningKey(VrfSigningKey),
    #[serde(rename = "PaymentVerificationKeyShelley_ed25519")]
    PaymentVerificationKeyShelley(PaymentVerificationKeyShelley),
    #[serde(rename = "PaymentSigningKeyShelley_ed25519")]
    PaymentSigningKeyShelley(PaymentSigningKeyShelley),
    PlutusScriptV2(PlutusScriptV2),
}

impl Key {
    pub fn from_path(path: PathBuf) -> anyhow::Result<Self> {
        serde_json::from_reader(
            File::open(path.clone())
                .context(format!("failed to open the key config file: {path:?}"))?,
        )
        .map_err(|err| anyhow!("Can't deserialize key: {err}"))
    }

    pub fn public_key(self) -> anyhow::Result<PublicKey> {
        let bytes = match self {
            Key::StakePoolVerificationKey(key) => hex::decode(key.cbor_hex)?,
            Key::StakeVerificationKeyShelley(key) => hex::decode(key.cbor_hex)?,
            Key::VrfVerificationKey(key) => hex::decode(key.cbor_hex)?,
            Key::PaymentVerificationKeyShelley(key) => hex::decode(key.cbor_hex)?,
            _ => bail!("Can't convert {self:?} to PublicKey"),
        };
        let mut deserializer = cbor_event::de::Deserializer::from(Cursor::new(bytes));
        let (bytes, _len) = deserializer.bytes_sz()?;
        PublicKey::from_raw_bytes(&bytes).map_err(|err| anyhow!("Can't decode PublicKey: {err}"))
    }

    pub fn private_key(self) -> anyhow::Result<PrivateKey> {
        let bytes = match self {
            Key::StakePoolSigningKey(key) => hex::decode(key.cbor_hex)?,
            Key::StakeSigningKeyShelley(key) => hex::decode(key.cbor_hex)?,
            Key::VrfSigningKey(key) => hex::decode(key.cbor_hex)?,
            Key::PaymentSigningKeyShelley(key) => hex::decode(key.cbor_hex)?,
            _ => bail!("Can't convert {self:?} to PrivateKey"),
        };
        let mut deserializer = cbor_event::de::Deserializer::from(Cursor::new(bytes));
        let (bytes, _len) = deserializer.bytes_sz()?;
        PrivateKey::from_normal_bytes(&bytes)
            .map_err(|err| anyhow!("Can't decode PrivateKey: {err}"))
    }

    pub fn plutus_script(self) -> anyhow::Result<PlutusV2Script> {
        let bytes = match self {
            Key::PlutusScriptV2(key) => hex::decode(key.cbor_hex)?,
            _ => bail!("Can't convert {self:?} to PublicKey"),
        };
        // let mut deserializer = cbor_event::de::Deserializer::from(Cursor::new(bytes));
        // let (bytes, len) = deserializer.bytes_sz()?;
        PlutusV2Script::from_bytes(bytes)
            .map_err(|err| anyhow!("Can't decode plutus script: {err}"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakePoolVerificationKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakePoolSigningKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakeVerificationKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakeSigningKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct VrfVerificationKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct VrfSigningKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PaymentVerificationKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PaymentSigningKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, Deserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PlutusScriptV2 {
    description: String,
    cbor_hex: String,
}
