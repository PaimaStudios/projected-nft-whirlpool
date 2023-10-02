use anyhow::{anyhow, bail, Context};
use clap::Parser;

use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{header, Client, StatusCode};
use serde::de::Error;
use serde::{
    Deserialize as SerdeDeserialize, Deserializer, Serialize as SerdeSerialize, Serializer,
};
use std::fmt;
use std::fs::File;
use std::hash::Hash;
use std::io::{Cursor, Read};
use std::path::PathBuf;
use std::str::FromStr;
use std::time::UNIX_EPOCH;
use cardano_serialization_lib::fees::LinearFee;
use cardano_serialization_lib::plutus::{ConstrPlutusData, Costmdls, CostModel, ExUnitPrices, ExUnits, Language, LanguageKind, PlutusData, PlutusList, PlutusScript, Redeemer, RedeemerTag};
use cardano_serialization_lib::tx_builder::{TransactionBuilder, TransactionBuilderConfigBuilder};
use cardano_serialization_lib::{AssetName, Assets, MultiAsset, PolicyID, RequiredSigners, Transaction, TransactionInput, TransactionOutput, TransactionWitnessSet, UnitInterval};
use cardano_serialization_lib::address::{Address, BaseAddress, EnterpriseAddress, StakeCredential};
use cardano_serialization_lib::crypto::{Bip32PrivateKey, PrivateKey, PublicKey, ScriptHash, TransactionHash, Vkeywitnesses};
use cardano_serialization_lib::output_builder::TransactionOutputBuilder;
use cardano_serialization_lib::tx_builder::mint_builder::{MintBuilder, MintWitness};
use cardano_serialization_lib::tx_builder::tx_inputs_builder::ScriptWitnessType::PlutusScriptWitness;
use cardano_serialization_lib::tx_builder::tx_inputs_builder::{DatumSource, PlutusScriptSource, PlutusWitness, TxInputsBuilder};
use cardano_serialization_lib::tx_builder_constants::TxBuilderConstants;
use cardano_serialization_lib::utils::{BigNum, hash_transaction, Int, make_vkey_witness, Value};
use cbored::{Bytes, Writer};
use cryptoxide::hashing::blake2b_256;
use minicbor::{Decoder, Encoder};
use projected_nft_sdk::conversions::{MintRedeemer, OutRef, Owner, ProjectedNFTDatums, ProjectedNFTRedeemers, Redeem, State, Status};

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
    Lock(ConfigPath),
    LockNft(ConfigPath),
    Unlock(ConfigPath),
    Claim(ConfigPath),
}

#[derive(Parser)]
pub struct ConfigPath {
    config: PathBuf,
}



#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct PaymentConfiguration {
    pub payment_bech32: Option<String>,
    pub payment_vkey: Option<PathBuf>,

    pub payment_skey: Option<PathBuf>,
    pub payment_mnemonics: Option<PathBuf>,
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct ControlNft {
    pub policy_id: String,
    pub asset_name: String,
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct ReceiptNft {
    pub minting_script: String,
    pub asset_name: String,
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct LockConfiguration {
    pub payment_configuration: PaymentConfiguration,

    pub inputs: Vec<UtxoPointer>,
    pub collateral: UtxoPointer,

    pub lock_on: String,
    pub lock_ada: u64,

    #[serde(default)]
    pub control_nft: Option<ControlNft>,

    #[serde(default)]
    pub receipt_nft: Option<ReceiptNft>,
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct LockNftConfiguration {
    pub payment_configuration: PaymentConfiguration,

    pub inputs: Vec<UtxoPointer>,

    pub lock_on: String,
    pub lock_ada: u64,
    pub nft_policy_id: String,
    pub nft_asset_name: String,

    #[serde(default)]
    pub control_nft: Option<ControlNft>,

    #[serde(default)]
    pub receipt_nft: Option<ReceiptNft>,
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct UnlockConfiguration {
    pub payment_configuration: PaymentConfiguration,

    pub inputs: Vec<UtxoPointer>,
    pub collateral: UtxoPointer,
    pub locked: UtxoPointer,

    pub locked_on: String,

    #[serde(default)]
    pub control_nft: Option<ControlNft>,

    #[serde(default)]
    pub receipt_nft: Option<ReceiptNft>,
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

        Command::Lock(params) => handle_lock(params, config, submit).await,
        Command::LockNft(params) => handle_lock_nft(params, config, submit).await,
        Command::Unlock(params) => handle_unlock(params, config, submit).await,
        Command::Claim(params) => handle_claim(params, config, submit).await,
        _ => todo!(),
    }
}

async fn handle_lock(
    config: ConfigPath,
    blockfrost: BlockfrostConfiguration,
    submit: bool,
) -> anyhow::Result<()> {
    let config: LockConfiguration = serde_yaml::from_reader(
        File::open(config.config).context("failed to open the delegate rewards config file")?,
    )?;

    let network = blockfrost.get_network();
    println!("Network:\t{network}");

    let payment_address = get_payment_creds(network, config.payment_configuration.payment_vkey, config.payment_configuration.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let mut builder = create_tx_builder();

    let blockfrost = Blockfrost::new(blockfrost)?;
    let mut inputs_builder = TxInputsBuilder::new();
    let (_, inputs) =
        fetch_inputs(config.inputs.clone(), &blockfrost).await?;

    for (pointer, input) in inputs {
        inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_inputs(&inputs_builder);

    // collateral

    if config.receipt_nft.is_some() {
        let mut collateral_inputs_builder = TxInputsBuilder::new();
        let (_, collateral) =
            fetch_inputs(vec![config.collateral], &blockfrost).await?;

        for (pointer, input) in collateral {
            collateral_inputs_builder
                .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
        }

        builder.set_collateral(&collateral_inputs_builder);
    }

    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let validity = ttl_by_posix(now - 100);
    let ttl = ttl_by_posix(now + 100);

    let contract = PlutusScript::from_hex_with_version(
        &config.lock_on, &Language::new_plutus_v2(),
    )
        .map_err(|err| anyhow!("Can't deserialize plutus script: {err}"))?;

    let lock_on =
        EnterpriseAddress::new(network, &StakeCredential::from_scripthash(&contract.hash())).to_address();
    println!("Lock on contract: {}", lock_on.to_bech32(None).unwrap());

    let receipt_asset_name = if let Some(nft) = config.receipt_nft.clone() {
        let mint_contract = PlutusScript::from_hex_with_version(
            &nft.minting_script, &Language::new_plutus_v2(),
        )
            .map_err(|err| anyhow!("Can't deserialize plutus script: {err}"))?;

        let mut mint_builder = MintBuilder::new();
        let asset_name = OutRef { tx_id: config.inputs.first().cloned().unwrap().hash.to_bytes(), index: config.inputs.first().cloned().unwrap().index };
        let mut asset_name = PlutusData::from(asset_name).to_bytes();
        asset_name.push(1);
        let asset_name = blake2b_256(&asset_name).to_vec();
        mint_builder.add_asset(
            &MintWitness::new_plutus_script(
                &PlutusScriptSource::new(&mint_contract),
                &Redeemer::new(&RedeemerTag::new_mint(), &BigNum::zero(), &PlutusData::from(MintRedeemer::MintTokens { total: 1 }), &ExUnits::new(&BigNum::from(1400000u64), &BigNum::from(1000000000u64))),
            ),
            &AssetName::new(asset_name.clone()).unwrap(),
            &Int::new(&BigNum::one()),
        );
        builder.set_mint_builder(&mint_builder);

        let ma = mint_builder.build().as_positive_multiasset();

        builder
            .add_output(
                &TransactionOutputBuilder::new()
                    .with_address(&payment_address)
                    .next()
                    .unwrap()
                    .with_value(&Value::new_with_assets(&BigNum::from(2000000u64), &ma))
                    .build()
                    .unwrap(),
            )
            .map_err(|err| anyhow!("Can't add output: {err}"))?;
        Some(asset_name)
    } else {
        None
    };

    let datum = match config.control_nft.clone() {
        None if config.receipt_nft.is_none() => {
            ProjectedNFTDatums::State(State {
                owner: Owner::PKH(EnterpriseAddress::from_address(&payment_address).ok_or(anyhow!("payment address is not base"))?.payment_cred().to_keyhash().unwrap().to_bytes()),
                status: Status::Locked,
            })
        }
        None => {
            println!("hex asset: {}", hex::encode(receipt_asset_name.clone().unwrap()));
            ProjectedNFTDatums::State(State {
                owner: Owner::Receipt(receipt_asset_name.unwrap()),
                status: Status::Locked,
            })
        }
        Some(nft) => {
            ProjectedNFTDatums::State(State {
                owner: Owner::NFT(hex::decode(nft.policy_id).unwrap(), nft.asset_name.as_bytes().to_vec()),
                status: Status::Locked,
            })
        }
    };

    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&lock_on)
                .with_plutus_data(&PlutusData::from(datum))
                .next()
                .unwrap()
                .with_value(&Value::new(&BigNum::from(config.lock_ada)))
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    if let Some(nft) = config.control_nft {
        let mut ma = MultiAsset::new();
        let mut assets = Assets::new();
        assets.insert(&AssetName::new(nft.asset_name.as_bytes().to_vec()).unwrap(), &BigNum::one());
        ma.insert(&PolicyID::from_bytes(hex::decode(nft.policy_id).unwrap()).unwrap(), &assets);

        builder
            .add_output(
                &TransactionOutputBuilder::new()
                    .with_address(&payment_address)
                    .next()
                    .unwrap()
                    .with_value(&Value::new_with_assets(&BigNum::from(2000000u64), &ma))
                    .build()
                    .unwrap(),
            )
            .map_err(|err| anyhow!("Can't add output: {err}"))?;
    };


    builder.set_ttl_bignum(&BigNum::from(ttl));
    builder.set_validity_start_interval_bignum(BigNum::from(validity));
    builder.calc_script_data_hash(&TxBuilderConstants::plutus_vasil_cost_models()).unwrap();

    builder
        .add_change_if_needed(&payment_address).unwrap();

    let body = builder.build()
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;

    if config.payment_configuration.payment_skey.is_none() && config.payment_configuration.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs());
        println!("outputs {:?}", body.outputs());
        println!("collateral {:?}", body.collateral());
        println!("collateral return {:?}", body.collateral_return());
        println!("fee {:?}", body.fee());

        println!(
            "body: {}",
            Transaction::new(&body, &TransactionWitnessSet::new(), None).to_hex()
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_configuration.payment_skey, config.payment_configuration.payment_mnemonics)?;

    let mut witness_set = builder.build_tx().unwrap().witness_set();
    let mut vkeys = Vkeywitnesses::new();
    vkeys.add(&make_vkey_witness(&hash_transaction(&body), &payment_address_sk));
    witness_set.set_vkeys(&vkeys);

    let tx = Transaction::new(&body, &witness_set, None);

    println!("inputs {:?}", body.inputs());
    println!("outputs {:?}", body.outputs());
    println!("collateral {:?}", body.collateral());
    println!("collateral return {:?}", body.collateral());
    println!("fee {:?}", body.fee());

    finalize_and_submit_tx(tx, blockfrost, submit).await
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

    let payment_address = get_payment_creds(network, config.payment_configuration.payment_vkey, config.payment_configuration.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let mut builder = create_tx_builder();

    let blockfrost = Blockfrost::new(blockfrost)?;
    let mut inputs_builder = TxInputsBuilder::new();
    let (_, inputs) =
        fetch_inputs(config.inputs, &blockfrost).await?;

    for (pointer, input) in inputs {
        inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_inputs(&inputs_builder);

    let contract = PlutusScript::from_hex_with_version(
        &config.lock_on, &Language::new_plutus_v2(),
    )
        .map_err(|err| anyhow!("Can't deserialize plutus script: {err}"))?;

    let lock_on =
        EnterpriseAddress::new(network, &StakeCredential::from_scripthash(&contract.hash())).to_address();
    println!("Lock on contract: {}", lock_on.to_bech32(None).unwrap());

    let datum = match config.control_nft.clone() {
        None => {
            ProjectedNFTDatums::State(State {
                owner: Owner::PKH(EnterpriseAddress::from_address(&payment_address).ok_or(anyhow!("payment address is not base"))?.payment_cred().to_keyhash().unwrap().to_bytes()),
                status: Status::Locked,
            })
        }
        Some(nft) => {
            ProjectedNFTDatums::State(State {
                owner: Owner::NFT(hex::decode(nft.policy_id).unwrap(), nft.asset_name.as_bytes().to_vec()),
                status: Status::Locked,
            })
        }
    };

    let mut ma = MultiAsset::new();
    let mut assets = Assets::new();
    assets.insert(&AssetName::new(config.nft_asset_name.as_bytes().to_vec()).unwrap(), &BigNum::one());
    ma.insert(&PolicyID::from_bytes(hex::decode(config.nft_policy_id).unwrap()).unwrap(), &assets);

    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&lock_on)
                .with_plutus_data(&PlutusData::from(datum))
                .next()
                .unwrap()
                .with_value(&Value::new_with_assets(&BigNum::from(config.lock_ada), &ma))
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    if let Some(nft) = config.control_nft.clone() {
        let mut ma = MultiAsset::new();
        let mut assets = Assets::new();
        assets.insert(&AssetName::new(nft.asset_name.as_bytes().to_vec()).unwrap(), &BigNum::one());
        ma.insert(&PolicyID::from_bytes(hex::decode(nft.policy_id).unwrap()).unwrap(), &assets);

        builder
            .add_output(
                &TransactionOutputBuilder::new()
                    .with_address(&payment_address)
                    .next()
                    .unwrap()
                    .with_value(&Value::new_with_assets(&BigNum::from(2000000u64), &ma))
                    .build()
                    .unwrap(),
            )
            .map_err(|err| anyhow!("Can't add output: {err}"))?;
    };

    builder
        .add_change_if_needed(&payment_address).unwrap();

    let body = builder.build()
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;

    if config.payment_configuration.payment_skey.is_none() && config.payment_configuration.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs());
        println!("outputs {:?}", body.outputs());
        println!("collateral {:?}", body.collateral());
        println!("collateral return {:?}", body.collateral_return());
        println!("fee {:?}", body.fee());

        println!(
            "body: {}",
            Transaction::new(&body, &TransactionWitnessSet::new(), None).to_hex()
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_configuration.payment_skey, config.payment_configuration.payment_mnemonics)?;

    let mut witness_set = builder.build_tx().unwrap().witness_set();
    let mut vkeys = Vkeywitnesses::new();
    vkeys.add(&make_vkey_witness(&hash_transaction(&body), &payment_address_sk));
    witness_set.set_vkeys(&vkeys);

    let tx = Transaction::new(&body, &witness_set, None);

    println!("inputs {:?}", body.inputs());
    println!("outputs {:?}", body.outputs());
    println!("collateral {:?}", body.collateral());
    println!("collateral return {:?}", body.collateral());
    println!("fee {:?}", body.fee());

    finalize_and_submit_tx(tx, blockfrost, submit).await
}

async fn handle_unlock(
    config: ConfigPath,
    blockfrost: BlockfrostConfiguration,
    submit: bool,
) -> anyhow::Result<()> {
    let config: UnlockConfiguration = serde_yaml::from_reader(
        File::open(config.config).context("failed to open the delegate rewards config file")?,
    )?;

    let network = blockfrost.get_network();
    println!("Network:\t{network}");

    let payment_address = get_payment_creds(network, config.payment_configuration.payment_vkey, config.payment_configuration.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let mut builder = create_tx_builder();

    let blockfrost = Blockfrost::new(blockfrost)?;
    let mut inputs_builder = TxInputsBuilder::new();


    // contract

    let contract = PlutusScript::from_hex_with_version(
        &config.locked_on, &Language::new_plutus_v2(),
    )
        .map_err(|err| anyhow!("Can't deserialize plutus script: {err}"))?;

    let lock_on =
        EnterpriseAddress::new(network, &StakeCredential::from_scripthash(&contract.hash())).to_address();
    println!("Lock on contract: {}", lock_on.to_bech32(None).unwrap());

    let old_datum = ProjectedNFTDatums::State(State {
        owner: Owner::PKH(EnterpriseAddress::from_address(&payment_address).ok_or(anyhow!("payment address is not base"))?.payment_cred().to_keyhash().unwrap().to_bytes()),
        status: Status::Locked,
    });

    let redeemer = ProjectedNFTRedeemers::Redeem(Redeem {
        partial_withdraw: false,
        nft_input_owner: match config.control_nft.clone() {
            None => None,
            Some(_) => {
                Some(OutRef {
                    tx_id: config.inputs.last().cloned().unwrap().hash.to_bytes(),
                    index: config.inputs.last().cloned().unwrap().index,
                })
            }
        },
        new_receipt_owner: None,
    });

    let (contract_balance, contract_inputs) =
        fetch_inputs(vec![config.locked], &blockfrost).await?;

    let (contract_input_pointer, contract_input) = contract_inputs.get(0).cloned().unwrap();
    inputs_builder.add_plutus_script_input(
        &PlutusWitness::new_with_ref(
            &PlutusScriptSource::new(&contract),
            &DatumSource::new_ref_input(&TransactionInput::new(
                &contract_input_pointer.hash,
                contract_input_pointer.index as u32,
            )),
            &Redeemer::new(&RedeemerTag::new_spend(), &BigNum::zero(), &PlutusData::from(redeemer), &ExUnits::new(&BigNum::from(14000000u64), &BigNum::from(10000000000u64)))
        ),
        &TransactionInput::new(&contract_input_pointer.hash, contract_input_pointer.index as u32),
        &contract_input,
    );

    let (normal_input_balance, inputs) =
        fetch_inputs(config.inputs, &blockfrost).await?;

    for (pointer, input) in inputs {
        inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_inputs(&inputs_builder);
    builder.add_required_signer(&EnterpriseAddress::from_address(&payment_address).unwrap().payment_cred().to_keyhash().unwrap());
    // collateral

    let mut collateral_inputs_builder = TxInputsBuilder::new();
    let (_, collateral) =
        fetch_inputs(vec![config.collateral], &blockfrost).await?;

    for (pointer, input) in collateral {
        collateral_inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_collateral(&collateral_inputs_builder);

    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let validity = ttl_by_posix(now - 100);
    let ttl = ttl_by_posix(now + 100);
    let for_how_long = (now + 400) * 1000;

    let new_datum = match config.control_nft.clone() {
        None => {
            ProjectedNFTDatums::State(State {
                owner: Owner::PKH(EnterpriseAddress::from_address(&payment_address).ok_or(anyhow!("payment address is not base"))?.payment_cred().to_keyhash().unwrap().to_bytes()),
                status: Status::Unlocking {
                    out_ref: OutRef {
                        tx_id: contract_input_pointer.hash.to_bytes(),
                        index: contract_input_pointer.index,
                    },
                    for_how_long,
                },
            })
        }
        Some(nft) => {
            ProjectedNFTDatums::State(State {
                owner: Owner::NFT(hex::decode(nft.policy_id).unwrap(), nft.asset_name.as_bytes().to_vec()),
                status: Status::Unlocking {
                    out_ref: OutRef {
                        tx_id: contract_input_pointer.hash.to_bytes(),
                        index: contract_input_pointer.index,
                    },
                    for_how_long,
                },
            })
        }
    };

    builder.set_ttl_bignum(&BigNum::from(ttl));
    builder.set_validity_start_interval_bignum(BigNum::from(validity));
    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&lock_on)
                .with_plutus_data(&PlutusData::from(new_datum))
                .next()
                .unwrap()
                .with_value(&contract_input)
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    if let Some(nft) = config.control_nft.clone() {
        let mut ma = MultiAsset::new();
        let mut assets = Assets::new();
        assets.insert(&AssetName::new(nft.asset_name.as_bytes().to_vec()).unwrap(), &BigNum::one());
        ma.insert(&PolicyID::from_bytes(hex::decode(nft.policy_id).unwrap()).unwrap(), &assets);

        builder
            .add_output(
                &TransactionOutputBuilder::new()
                    .with_address(&payment_address)
                    .next()
                    .unwrap()
                    .with_value(&Value::new_with_assets(&BigNum::from(2000000u64), &ma))
                    .build()
                    .unwrap(),
            )
            .map_err(|err| anyhow!("Can't add output: {err}"))?;
    };

    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&payment_address)
                .next()
                .unwrap()
                .with_value(&Value::new(&normal_input_balance.coin().checked_sub(&BigNum::from(10000000u64 + config.control_nft.map(|_| 2000000u64).unwrap_or(0))).unwrap()))
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    builder.set_fee(&BigNum::from(10000000u64));

    builder.calc_script_data_hash(&TxBuilderConstants::plutus_vasil_cost_models()).unwrap();

    let body = builder.build()
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;

    if config.payment_configuration.payment_skey.is_none() && config.payment_configuration.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs());
        println!("outputs {:?}", body.outputs());
        println!("collateral {:?}", body.collateral());
        println!("collateral return {:?}", body.collateral_return());
        println!("fee {:?}", body.fee());

        println!(
            "body: {}",
            Transaction::new(&body, &TransactionWitnessSet::new(), None).to_hex()
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_configuration.payment_skey, config.payment_configuration.payment_mnemonics)?;

    let mut witness_set = builder.build_tx().unwrap().witness_set();
    let mut vkeys = Vkeywitnesses::new();
    vkeys.add(&make_vkey_witness(&hash_transaction(&body), &payment_address_sk));
    witness_set.set_vkeys(&vkeys);

    let tx = Transaction::new(&body, &witness_set, None);

    println!("inputs {:?}", body.inputs());
    println!("outputs {:?}", body.outputs());
    println!("collateral {:?}", body.collateral());
    println!("collateral return {:?}", body.collateral_return());
    println!("fee {:?}", body.fee());
    println!("witness set pl data {:?}", tx.witness_set().plutus_data());

    finalize_and_submit_tx(tx, blockfrost, submit).await
}

async fn handle_claim(
    config: ConfigPath,
    blockfrost: BlockfrostConfiguration,
    submit: bool,
) -> anyhow::Result<()> {
    let config: UnlockConfiguration = serde_yaml::from_reader(
        File::open(config.config).context("failed to open the delegate rewards config file")?,
    )?;

    let network = blockfrost.get_network();
    println!("Network:\t{network}");

    let payment_address = get_payment_creds(network, config.payment_configuration.payment_vkey, config.payment_configuration.payment_bech32)?;
    println!("Address:\t{}", payment_address.to_bech32(None).unwrap());

    let mut builder = create_tx_builder();

    let blockfrost = Blockfrost::new(blockfrost)?;
    let mut inputs_builder = TxInputsBuilder::new();


    // contract

    let contract = PlutusScript::from_hex_with_version(
        &config.locked_on, &Language::new_plutus_v2(),
    )
        .map_err(|err| anyhow!("Can't deserialize plutus script: {err}"))?;

    let lock_on =
        EnterpriseAddress::new(network, &StakeCredential::from_scripthash(&contract.hash())).to_address();
    println!("Lock on contract: {}", lock_on.to_bech32(None).unwrap());

    let redeemer = ProjectedNFTRedeemers::Redeem(Redeem {
        partial_withdraw: false,
        nft_input_owner: match config.control_nft {
            None => None,
            Some(_) => {
                Some(OutRef {
                    tx_id: config.inputs.last().cloned().unwrap().hash.to_bytes(),
                    index: config.inputs.last().cloned().unwrap().index,
                })
            }
        },
        new_receipt_owner: None,
    });

    let (_, contract_inputs) =
        fetch_inputs(vec![config.locked], &blockfrost).await?;

    let (contract_input_pointer, contract_input) = contract_inputs.get(0).cloned().unwrap();
    inputs_builder.add_plutus_script_input(
        &PlutusWitness::new_with_ref(
            &PlutusScriptSource::new(&contract),
            &DatumSource::new_ref_input(&TransactionInput::new(
                &contract_input_pointer.hash,
                contract_input_pointer.index as u32,
            )),
            &Redeemer::new(&RedeemerTag::new_spend(), &BigNum::zero(), &PlutusData::from(redeemer), &ExUnits::new(&BigNum::from(14000000u64), &BigNum::from(10000000000u64)))
        ),
        &TransactionInput::new(&contract_input_pointer.hash, contract_input_pointer.index as u32),
        &contract_input,
    );

    let (normal_input_balance, inputs) =
        fetch_inputs(config.inputs, &blockfrost).await?;

    for (pointer, input) in inputs {
        inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_inputs(&inputs_builder);
    // collateral

    let mut collateral_inputs_builder = TxInputsBuilder::new();
    let (_, collateral) =
        fetch_inputs(vec![config.collateral], &blockfrost).await?;

    for (pointer, input) in collateral {
        collateral_inputs_builder
            .add_input(&payment_address, &TransactionInput::new(&pointer.hash, pointer.index as u32), &input);
    }

    builder.set_collateral(&collateral_inputs_builder);

    let now = std::time::SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let validity = ttl_by_posix(now - 120);
    let ttl = ttl_by_posix(now + 100);

    builder.set_ttl_bignum(&BigNum::from(ttl));
    builder.set_validity_start_interval_bignum(BigNum::from(validity));
    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&payment_address)
                .next()
                .unwrap()
                .with_value(&contract_input)
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    if let Some(nft) = config.control_nft.clone() {
        let mut ma = MultiAsset::new();
        let mut assets = Assets::new();
        assets.insert(&AssetName::new(nft.asset_name.as_bytes().to_vec()).unwrap(), &BigNum::one());
        ma.insert(&PolicyID::from_bytes(hex::decode(nft.policy_id).unwrap()).unwrap(), &assets);

        builder
            .add_output(
                &TransactionOutputBuilder::new()
                    .with_address(&payment_address)
                    .next()
                    .unwrap()
                    .with_value(&Value::new_with_assets(&BigNum::from(2000000u64), &ma))
                    .build()
                    .unwrap(),
            )
            .map_err(|err| anyhow!("Can't add output: {err}"))?;
    };

    builder
        .add_output(
            &TransactionOutputBuilder::new()
                .with_address(&payment_address)
                .next()
                .unwrap()
                .with_value(&Value::new(&normal_input_balance.coin().checked_sub(&BigNum::from(10000000u64 + config.control_nft.map(|_| 2000000u64).unwrap_or(0))).unwrap()))
                .build()
                .unwrap(),
        )
        .map_err(|err| anyhow!("Can't add output: {err}"))?;

    builder.set_fee(&BigNum::from(10000000u64));

    builder.calc_script_data_hash(&TxBuilderConstants::plutus_vasil_cost_models()).unwrap();

    let body = builder.build()
        .map_err(|err| anyhow!("Can't create tx body {err}"))?;

    if config.payment_configuration.payment_skey.is_none() && config.payment_configuration.payment_mnemonics.is_none() {
        println!("inputs {:?}", body.inputs());
        println!("outputs {:?}", body.outputs());
        println!("collateral {:?}", body.collateral());
        println!("collateral return {:?}", body.collateral_return());
        println!("fee {:?}", body.fee());

        println!(
            "body: {}",
            Transaction::new(&body, &TransactionWitnessSet::new(), None).to_hex()
        );

        return Ok(());
    }

    let payment_address_sk = get_signing_creds(config.payment_configuration.payment_skey, config.payment_configuration.payment_mnemonics)?;

    let mut witness_set = builder.build_tx().unwrap().witness_set();
    let mut vkeys = Vkeywitnesses::new();
    vkeys.add(&make_vkey_witness(&hash_transaction(&body), &payment_address_sk));
    witness_set.set_vkeys(&vkeys);

    let tx = Transaction::new(&body, &witness_set, None);

    println!("inputs {:?}", body.inputs());
    println!("outputs {:?}", body.outputs());
    println!("collateral {:?}", body.collateral());
    println!("collateral return {:?}", body.collateral_return());
    println!("fee {:?}", body.fee());
    println!("witness set pl data {:?}", tx.witness_set().plutus_data());

    finalize_and_submit_tx(tx, blockfrost, submit).await
}

fn ttl_by_posix(posix: u64) -> u64 {
    (posix - 1655769600) + 86400
}

pub async fn finalize_and_submit_tx(
    final_tx: Transaction,
    blockfrost: Blockfrost,
    submit: bool,
) -> anyhow::Result<()> {
    println!("Final tx: {}", hex::encode(final_tx.to_bytes()));

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
) -> anyhow::Result<(Value, Vec<(UtxoPointer, Value)>)> {
    let mut total_input = Value::zero();
    let mut result = vec![];
    for input in inputs {
        let utxo_balance = blockfrost
            .get_utxo_info(input.hash.to_string(), input.index)
            .await?
            .into_iter()
            .map(Value::from)
            .fold(Value::zero(), |acc, new| acc.checked_add(&new).unwrap());

        total_input = total_input.checked_add(&utxo_balance).unwrap();
        result.push((input, utxo_balance));
    }

    Ok((total_input, result))
}

pub fn create_tx_builder() -> TransactionBuilder {
    let mut config = TransactionBuilderConfigBuilder::new()
        .max_tx_size(16384)
        .coins_per_utxo_byte(&BigNum::from(4310u64))
        .key_deposit(&BigNum::from(2000000u64))
        .pool_deposit(&BigNum::from(500000000u64))
        .max_value_size(5000)
        .ex_unit_prices(&ExUnitPrices::new(
            &UnitInterval::new(&BigNum::from(577u64), &BigNum::from(10000u64)),
            &UnitInterval::new(&BigNum::from(721u64), &BigNum::from(10000000u64)),
        ))
        .fee_algo(&LinearFee::new(&BigNum::from(44u64), &BigNum::from(155381u64)));

    let config = config.build().unwrap();

    TransactionBuilder::new(&config)
}

#[derive(Clone, Debug, SerdeDeserialize)]
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct BlockfrostConfiguration {
    pub endpoint: String,
    pub key: String,
}

#[derive(SerdeDeserialize, Debug)]
struct TxUtxos {
    outputs: Vec<TxOutput>,
}

#[derive(SerdeDeserialize, Debug)]
struct TxOutput {
    amount: Vec<AssetAmount>,
}

#[derive(SerdeDeserialize, Debug)]
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
        let bytes = transaction.to_bytes();
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

            TransactionHash::from_bytes(
                hex::decode(bf_id)
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

#[derive(SerdeDeserialize)]
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

impl<'de> SerdeDeserialize<'de> for UtxoPointer {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = SerdeDeserialize::deserialize(deserializer)?;
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
            TransactionHash::from_bytes(hex::decode(hash).context("Invalid Hash format")?)
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
        PolicyID::from_bytes(policy_id).map_err(|_| anyhow!("invalid policy id"))?;
    Ok((policy_id, asset_name))
}

impl From<AssetAmount> for Value {
    fn from(value: AssetAmount) -> Self {
        if value.unit == "lovelace" {
            Value::new_with_assets(&BigNum::from_str(&value.quantity).unwrap(), &MultiAsset::new())
        } else {
            let mut ma = MultiAsset::new();

            let (policy_id, asset_name) = parse_asset(&value.unit).unwrap();

            let mut assets = Assets::new();
            assets.insert(&asset_name, &BigNum::from_str(&value.quantity).unwrap());
            ma.insert(&policy_id, &assets);

            Value::new_with_assets(&BigNum::zero(), &ma)
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
            &StakeCredential::from_keyhash(&payment_address_pk.hash()),
        )
        .to_address())
    } else if let Some(pk) = bech32 {
        Ok(Address::from_bech32(&pk).map_err(|err| anyhow!("Can't parse bech32 pk: {err}"))?)
    } else {
        Err(anyhow!("No payment key provided"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
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
        PublicKey::from_bytes(&bytes).map_err(|err| anyhow!("Can't decode PublicKey: {err}"))
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

    pub fn plutus_script(self) -> anyhow::Result<PlutusScript> {
        let bytes = match self {
            Key::PlutusScriptV2(key) => hex::decode(key.cbor_hex)?,
            _ => bail!("Can't convert {self:?} to PublicKey"),
        };
        // let mut deserializer = cbor_event::de::Deserializer::from(Cursor::new(bytes));
        // let (bytes, len) = deserializer.bytes_sz()?;
        PlutusScript::from_bytes(bytes)
            .map_err(|err| anyhow!("Can't decode plutus script: {err}"))
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakePoolVerificationKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakePoolSigningKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakeVerificationKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct StakeSigningKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct VrfVerificationKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct VrfSigningKey {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PaymentVerificationKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PaymentSigningKeyShelley {
    description: String,
    cbor_hex: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, SerdeSerialize, SerdeDeserialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub struct PlutusScriptV2 {
    description: String,
    cbor_hex: String,
}
