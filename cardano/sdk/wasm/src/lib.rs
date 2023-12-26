#![allow(
    clippy::len_without_is_empty,
    clippy::too_many_arguments,
    clippy::new_without_default
)]
// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

mod output_reference;

use output_reference::OutRef;
use wasm_bindgen::prelude::{wasm_bindgen, JsError, JsValue};

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct MintRedeemer(cardano_projected_nft::MintRedeemer);

#[wasm_bindgen]
impl MintRedeemer {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<MintRedeemer, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn new_mint(total: &cml_chain_wasm::utils::BigInt) -> Self {
        Self(cardano_projected_nft::MintRedeemer::new_mint(
            total.clone().into(),
        ))
    }

    pub fn new_burn() -> Self {
        Self(cardano_projected_nft::MintRedeemer::new_burn())
    }

    pub fn kind(&self) -> MintRedeemerKind {
        match &self.0 {
            cardano_projected_nft::MintRedeemer::MintTokens { .. } => MintRedeemerKind::MintTokens,
            cardano_projected_nft::MintRedeemer::BurnTokens => MintRedeemerKind::BurnTokens,
        }
    }

    pub fn as_mint_tokens(&self) -> Option<cml_chain_wasm::utils::BigInt> {
        match &self.0 {
            cardano_projected_nft::MintRedeemer::MintTokens { total } => Some(total.clone().into()),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft::MintRedeemer> for MintRedeemer {
    fn from(native: cardano_projected_nft::MintRedeemer) -> Self {
        Self(native)
    }
}

impl From<MintRedeemer> for cardano_projected_nft::MintRedeemer {
    fn from(wasm: MintRedeemer) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::MintRedeemer> for MintRedeemer {
    fn as_ref(&self) -> &cardano_projected_nft::MintRedeemer {
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
    pub fn policy_id(&self) -> cml_chain_wasm::PolicyId {
        self.0.into()
    }

    pub fn asset_name(&self) -> cml_chain_wasm::assets::AssetName {
        self.1.clone().into()
    }

    pub fn new(
        policy_id: &cml_chain_wasm::PolicyId,
        asset_name: &cml_chain_wasm::assets::AssetName,
    ) -> NFT {
        Self(
            policy_id.clone().into(),
            Into::<cml_chain::assets::AssetName>::into(asset_name.clone()),
        )
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Owner(cardano_projected_nft::Owner);

#[wasm_bindgen]
impl Owner {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Owner, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn new_keyhash(keyhash: &cml_crypto_wasm::Ed25519KeyHash) -> Self {
        Self(cardano_projected_nft::Owner::new_keyhash(
            keyhash.clone().into(),
        ))
    }

    pub fn new_nft(nft: &NFT) -> Self {
        Self(cardano_projected_nft::Owner::new_nft(nft.0, nft.1.clone()))
    }

    pub fn new_receipt(receipt: &cml_chain_wasm::assets::AssetName) -> Self {
        Self(cardano_projected_nft::Owner::new_receipt(
            receipt.clone().into(),
        ))
    }

    pub fn kind(&self) -> OwnerKind {
        match &self.0 {
            cardano_projected_nft::Owner::PKH(_) => OwnerKind::PublicKeyHash,
            cardano_projected_nft::Owner::NFT(_, _) => OwnerKind::NFT,
            cardano_projected_nft::Owner::Receipt(_) => OwnerKind::Receipt,
        }
    }

    pub fn as_public_keyhash(&self) -> Option<cml_crypto_wasm::Ed25519KeyHash> {
        match &self.0 {
            cardano_projected_nft::Owner::PKH(pkh) => Some((*pkh).into()),
            _ => None,
        }
    }

    pub fn as_nft(&self) -> Option<NFT> {
        match &self.0 {
            cardano_projected_nft::Owner::NFT(policy_id, asset_name) => {
                Some(NFT(*policy_id, asset_name.clone()))
            }
            _ => None,
        }
    }

    pub fn as_receipt(&self) -> Option<cml_chain_wasm::assets::AssetName> {
        match &self.0 {
            cardano_projected_nft::Owner::Receipt(receipt) => Some(receipt.clone().into()),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft::Owner> for Owner {
    fn from(native: cardano_projected_nft::Owner) -> Self {
        Self(native)
    }
}

impl From<Owner> for cardano_projected_nft::Owner {
    fn from(wasm: Owner) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::Owner> for Owner {
    fn as_ref(&self) -> &cardano_projected_nft::Owner {
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
pub struct Redeem(cardano_projected_nft::Redeem);

#[wasm_bindgen]
impl Redeem {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Redeem, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn partial_withdraw(&self) -> bool {
        self.0.partial_withdraw
    }

    pub fn nft_input_owner(&self) -> Option<OutRef> {
        self.0.nft_input_owner.clone().map(std::convert::Into::into)
    }

    pub fn new_receipt_owner(&self) -> Option<cml_chain_wasm::assets::AssetName> {
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
        Self(cardano_projected_nft::Redeem::new(
            partial_withdraw,
            nft_input_owner.map(Into::into),
            new_receipt_owner.map(Into::into),
        ))
    }
}

impl From<cardano_projected_nft::Redeem> for Redeem {
    fn from(native: cardano_projected_nft::Redeem) -> Self {
        Self(native)
    }
}

impl From<Redeem> for cardano_projected_nft::Redeem {
    fn from(wasm: Redeem) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::Redeem> for Redeem {
    fn as_ref(&self) -> &cardano_projected_nft::Redeem {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct State(cardano_projected_nft::State);

#[wasm_bindgen]
impl State {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<State, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn owner(&self) -> Owner {
        self.0.owner.clone().into()
    }

    pub fn status(&self) -> Status {
        self.0.status.clone().into()
    }

    pub fn new(owner: &Owner, status: &Status) -> Self {
        Self(cardano_projected_nft::State::new(
            owner.clone().into(),
            status.clone().into(),
        ))
    }
}

impl From<cardano_projected_nft::State> for State {
    fn from(native: cardano_projected_nft::State) -> Self {
        Self(native)
    }
}

impl From<State> for cardano_projected_nft::State {
    fn from(wasm: State) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::State> for State {
    fn as_ref(&self) -> &cardano_projected_nft::State {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Status(cardano_projected_nft::Status);

#[wasm_bindgen]
impl Status {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<Status, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn new_locked() -> Self {
        Self(cardano_projected_nft::Status::new_locked())
    }

    pub fn new_unlocking(unlocking: &UnlockingStatus) -> Self {
        Self(cardano_projected_nft::Status::new_unlocking(
            unlocking.out_ref().clone().into(),
            unlocking.for_how_long().into(),
        ))
    }

    pub fn kind(&self) -> StatusKind {
        match &self.0 {
            cardano_projected_nft::Status::Locked { .. } => StatusKind::Locked,
            cardano_projected_nft::Status::Unlocking { .. } => StatusKind::Unlocking,
        }
    }

    pub fn as_unlocking(&self) -> Option<UnlockingStatus> {
        match &self.0 {
            cardano_projected_nft::Status::Unlocking {
                out_ref,
                for_how_long,
            } => Some(UnlockingStatus(out_ref.clone(), for_how_long.clone())),
            _ => None,
        }
    }
}

impl From<cardano_projected_nft::Status> for Status {
    fn from(native: cardano_projected_nft::Status) -> Self {
        Self(native)
    }
}

impl From<Status> for cardano_projected_nft::Status {
    fn from(wasm: Status) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::Status> for Status {
    fn as_ref(&self) -> &cardano_projected_nft::Status {
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
pub struct UnlockingStatus(cardano_projected_nft::OutRef, cml_chain::utils::BigInt);

#[wasm_bindgen]
impl UnlockingStatus {
    pub fn out_ref(&self) -> OutRef {
        self.0.clone().into()
    }

    pub fn for_how_long(&self) -> cml_chain_wasm::utils::BigInt {
        self.1.clone().into()
    }

    pub fn new(out_ref: &OutRef, for_how_long: &cml_chain_wasm::utils::BigInt) -> Self {
        UnlockingStatus(out_ref.clone().into(), for_how_long.clone().into())
    }
}
