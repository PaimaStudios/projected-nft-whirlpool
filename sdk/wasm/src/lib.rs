#![allow(
    clippy::len_without_is_empty,
    clippy::too_many_arguments,
    clippy::new_without_default
)]
// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use cml_chain::assets::AssetName;

use wasm_bindgen::prelude::{wasm_bindgen, JsValue};

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct MintRedeemer(cardano_projected_nft_sdk::MintRedeemer);

#[wasm_bindgen]
impl MintRedeemer {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        redeemer: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<MintRedeemer, JsValue> {
        cardano_projected_nft_sdk::MintRedeemer::try_from(
            Into::<cml_chain::plutus::PlutusData>::into(redeemer.clone()),
        )
        .map(MintRedeemer)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<MintRedeemer, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn new_mint(total: u64) -> Self {
        Self(cardano_projected_nft_sdk::MintRedeemer::new_mint(total))
    }

    pub fn new_burn() -> Self {
        Self(cardano_projected_nft_sdk::MintRedeemer::new_burn())
    }

    pub fn kind(&self) -> MintRedeemerKind {
        match &self.0 {
            cardano_projected_nft_sdk::MintRedeemer::MintTokens { .. } => {
                MintRedeemerKind::MintTokens
            }
            cardano_projected_nft_sdk::MintRedeemer::BurnTokens => MintRedeemerKind::BurnTokens,
        }
    }

    pub fn as_mint_tokens(&self) -> Option<u64> {
        match &self.0 {
            cardano_projected_nft_sdk::MintRedeemer::MintTokens { total } => Some(*total),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft_sdk::MintRedeemer> for MintRedeemer {
    fn from(native: cardano_projected_nft_sdk::MintRedeemer) -> Self {
        Self(native)
    }
}

impl From<MintRedeemer> for cardano_projected_nft_sdk::MintRedeemer {
    fn from(wasm: MintRedeemer) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::MintRedeemer> for MintRedeemer {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::MintRedeemer {
        &self.0
    }
}

#[wasm_bindgen]
pub enum MintRedeemerKind {
    MintTokens,
    BurnTokens,
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct NFT(cml_chain::PolicyId, cml_chain::assets::AssetName);

#[wasm_bindgen]
impl NFT {
    pub fn new(
        policy_id: &cml_chain_wasm::PolicyId,
        asset_name: &cml_chain_wasm::assets::AssetName,
    ) -> NFT {
        Self(
            policy_id.clone().into(),
            Into::<cml_chain::assets::AssetName>::into(asset_name.clone()),
        )
    }

    pub fn policy_id(&self) -> cml_chain_wasm::PolicyId {
        self.0.clone().into()
    }

    pub fn asset_name(&self) -> cml_chain_wasm::assets::AssetName {
        self.1.clone().into()
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Owner(cardano_projected_nft_sdk::Owner);

#[wasm_bindgen]
impl Owner {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(owner: &cml_chain_wasm::plutus::PlutusData) -> Result<Owner, JsValue> {
        cardano_projected_nft_sdk::Owner::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            owner.clone(),
        ))
        .map(Owner)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Owner, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn new_keyhash(keyhash: &cml_crypto_wasm::Ed25519KeyHash) -> Self {
        Self(cardano_projected_nft_sdk::Owner::new_keyhash(
            keyhash.clone().into(),
        ))
    }

    pub fn new_nft(nft: &NFT) -> Self {
        Self(cardano_projected_nft_sdk::Owner::new_nft(
            nft.0.clone(),
            nft.1.clone(),
        ))
    }

    pub fn new_receipt(receipt: &cml_chain_wasm::assets::AssetName) -> Self {
        Self(cardano_projected_nft_sdk::Owner::new_receipt(
            receipt.clone().into(),
        ))
    }

    pub fn kind(&self) -> OwnerKind {
        match &self.0 {
            cardano_projected_nft_sdk::Owner::PKH(_) => OwnerKind::PublicKeyHash,
            cardano_projected_nft_sdk::Owner::NFT(_, _) => OwnerKind::NFT,
            cardano_projected_nft_sdk::Owner::Receipt(_) => OwnerKind::Receipt,
        }
    }

    pub fn as_public_keyhash(&self) -> Option<cml_crypto_wasm::Ed25519KeyHash> {
        match &self.0 {
            cardano_projected_nft_sdk::Owner::PKH(pkh) => Some(pkh.clone().into()),
            _ => None,
        }
    }

    pub fn as_nft(&self) -> Option<NFT> {
        match &self.0 {
            cardano_projected_nft_sdk::Owner::NFT(policy_id, asset_name) => {
                Some(NFT(policy_id.clone(), asset_name.clone()))
            }
            _ => None,
        }
    }

    pub fn as_receipt(&self) -> Option<cml_chain_wasm::assets::AssetName> {
        match &self.0 {
            cardano_projected_nft_sdk::Owner::Receipt(receipt) => Some(receipt.clone().into()),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft_sdk::Owner> for Owner {
    fn from(native: cardano_projected_nft_sdk::Owner) -> Self {
        Self(native)
    }
}

impl From<Owner> for cardano_projected_nft_sdk::Owner {
    fn from(wasm: Owner) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::Owner> for Owner {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::Owner {
        &self.0
    }
}

#[wasm_bindgen]
pub enum OwnerKind {
    PublicKeyHash,
    NFT,
    Receipt,
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Redeem(cardano_projected_nft_sdk::Redeem);

impl Redeem {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        redeemer: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<Redeem, JsValue> {
        cardano_projected_nft_sdk::Redeem::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            redeemer.clone(),
        ))
        .map(Redeem)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Redeem, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn partial_withdraw(&self) -> bool {
        self.0.partial_withdraw
    }

    pub fn nft_input_owner(&self) -> Option<OutRef> {
        self.0.nft_input_owner.clone().map(std::convert::Into::into)
    }

    pub fn new_receipt_owner(&self) -> Option<AssetName> {
        self.0
            .new_receipt_owner
            .clone()
            .map(std::convert::Into::into)
    }

    pub fn new(
        partial_withdraw: bool,
        nft_input_owner: Option<OutRef>,
        new_receipt_owner: Option<cml_chain_wasm::assets::AssetName>,
    ) -> Self {
        Self(cardano_projected_nft_sdk::Redeem::new(
            partial_withdraw,
            nft_input_owner.map(Into::into),
            new_receipt_owner.map(Into::into),
        ))
    }
}

impl From<cardano_projected_nft_sdk::Redeem> for Redeem {
    fn from(native: cardano_projected_nft_sdk::Redeem) -> Self {
        Self(native)
    }
}

impl From<Redeem> for cardano_projected_nft_sdk::Redeem {
    fn from(wasm: Redeem) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::Redeem> for Redeem {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::Redeem {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct State(cardano_projected_nft_sdk::State);

#[wasm_bindgen]
impl State {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(state: &cml_chain_wasm::plutus::PlutusData) -> Result<State, JsValue> {
        cardano_projected_nft_sdk::State::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            state.clone(),
        ))
        .map(State)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<State, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn owner(&self) -> Owner {
        self.0.owner.clone().into()
    }

    pub fn status(&self) -> Status {
        self.0.status.clone().into()
    }

    pub fn new(owner: &Owner, status: &Status) -> Self {
        Self(cardano_projected_nft_sdk::State::new(
            owner.clone().into(),
            status.clone().into(),
        ))
    }
}

impl From<cardano_projected_nft_sdk::State> for State {
    fn from(native: cardano_projected_nft_sdk::State) -> Self {
        Self(native)
    }
}

impl From<State> for cardano_projected_nft_sdk::State {
    fn from(wasm: State) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::State> for State {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::State {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Status(cardano_projected_nft_sdk::Status);

#[wasm_bindgen]
impl Status {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        status: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<Status, JsValue> {
        cardano_projected_nft_sdk::Status::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            status.clone(),
        ))
        .map(Status)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Status, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn new_locked() -> Self {
        Self(cardano_projected_nft_sdk::Status::new_locked())
    }

    pub fn new_unlocking(unlocking: &UnlockingStatus) -> Self {
        Self(cardano_projected_nft_sdk::Status::new_unlocking(
            unlocking.out_ref().clone().into(),
            unlocking.for_how_long(),
        ))
    }

    pub fn kind(&self) -> StatusKind {
        match &self.0 {
            cardano_projected_nft_sdk::Status::Locked { .. } => StatusKind::Locked,
            cardano_projected_nft_sdk::Status::Unlocking { .. } => StatusKind::Unlocking,
        }
    }

    pub fn as_unlocking(&self) -> Option<UnlockingStatus> {
        match &self.0 {
            cardano_projected_nft_sdk::Status::Unlocking {
                out_ref,
                for_how_long,
            } => Some(UnlockingStatus(out_ref.clone(), *for_how_long)),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft_sdk::Status> for Status {
    fn from(native: cardano_projected_nft_sdk::Status) -> Self {
        Self(native)
    }
}

impl From<Status> for cardano_projected_nft_sdk::Status {
    fn from(wasm: Status) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::Status> for Status {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::Status {
        &self.0
    }
}

#[wasm_bindgen]
pub enum StatusKind {
    Locked,
    Unlocking,
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct UnlockingStatus(cardano_projected_nft_sdk::OutRef, u64);

#[wasm_bindgen]
impl UnlockingStatus {
    pub fn out_ref(&self) -> OutRef {
        self.0.clone().into()
    }

    pub fn for_how_long(&self) -> u64 {
        self.1
    }

    pub fn new(out_ref: &OutRef, for_how_long: u64) -> Self {
        UnlockingStatus(out_ref.clone().into(), for_how_long)
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct OutRef(cardano_projected_nft_sdk::OutRef);

#[wasm_bindgen]
impl OutRef {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        out_ref: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<OutRef, JsValue> {
        cardano_projected_nft_sdk::OutRef::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            out_ref.clone(),
        ))
        .map(OutRef)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn new(tx_id: &cml_crypto_wasm::TransactionHash, index: u64) -> Self {
        Self(cardano_projected_nft_sdk::OutRef::new(
            tx_id.clone().into(),
            index,
        ))
    }
}

impl From<cardano_projected_nft_sdk::OutRef> for OutRef {
    fn from(native: cardano_projected_nft_sdk::OutRef) -> Self {
        Self(native)
    }
}

impl From<OutRef> for cardano_projected_nft_sdk::OutRef {
    fn from(wasm: OutRef) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft_sdk::OutRef> for OutRef {
    fn as_ref(&self) -> &cardano_projected_nft_sdk::OutRef {
        &self.0
    }
}
