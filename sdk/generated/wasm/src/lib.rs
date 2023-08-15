#![allow(
    clippy::len_without_is_empty,
    clippy::too_many_arguments,
    clippy::new_without_default
)]
// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use cml_chain_wasm::assets::AssetName;
use cml_chain_wasm::transaction::TransactionInput;
use cml_chain_wasm::PolicyId;
use cml_crypto_wasm::Ed25519KeyHash as Keyhash;
use wasm_bindgen::prelude::{wasm_bindgen, JsValue};

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct NFT(projected_nft_structs::NFT);

#[wasm_bindgen]
impl NFT {
    pub fn to_cbor_bytes(&self) -> Vec<u8> {
        cml_core::serialization::Serialize::to_cbor_bytes(&self.0)
    }

    pub fn from_cbor_bytes(cbor_bytes: &[u8]) -> Result<NFT, JsValue> {
        cml_core::serialization::Deserialize::from_cbor_bytes(cbor_bytes)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_bytes: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<NFT, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn policy_id(&self) -> PolicyId {
        self.0.policy_id.clone().into()
    }

    pub fn asset_name(&self) -> AssetName {
        self.0.asset_name.clone().into()
    }

    pub fn new(policy_id: &PolicyId, asset_name: &AssetName) -> Self {
        Self(projected_nft_structs::NFT::new(
            policy_id.clone().into(),
            asset_name.clone().into(),
        ))
    }
}

impl From<projected_nft_structs::NFT> for NFT {
    fn from(native: projected_nft_structs::NFT) -> Self {
        Self(native)
    }
}

impl From<NFT> for projected_nft_structs::NFT {
    fn from(wasm: NFT) -> Self {
        wasm.0
    }
}

impl AsRef<projected_nft_structs::NFT> for NFT {
    fn as_ref(&self) -> &projected_nft_structs::NFT {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Owner(projected_nft_structs::Owner);

#[wasm_bindgen]
impl Owner {
    pub fn to_cbor_bytes(&self) -> Vec<u8> {
        cml_core::serialization::Serialize::to_cbor_bytes(&self.0)
    }

    pub fn from_cbor_bytes(cbor_bytes: &[u8]) -> Result<Owner, JsValue> {
        cml_core::serialization::Deserialize::from_cbor_bytes(cbor_bytes)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_bytes: {}", e)))
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

    pub fn new_p_k_h(p_k_h: &Keyhash) -> Self {
        Self(projected_nft_structs::Owner::new_public_keyhash(
            p_k_h.clone().into(),
        ))
    }

    pub fn new_n_f_t(n_f_t: &NFT) -> Self {
        Self(projected_nft_structs::Owner::new_nft(n_f_t.clone().into()))
    }

    pub fn new_receipt(receipt: &AssetName) -> Self {
        Self(projected_nft_structs::Owner::new_receipt(
            receipt.clone().into(),
        ))
    }

    pub fn kind(&self) -> OwnerKind {
        match &self.0 {
            projected_nft_structs::Owner::PKH { .. } => OwnerKind::PKH,
            projected_nft_structs::Owner::NFT(_) => OwnerKind::NFT,
            projected_nft_structs::Owner::Receipt(_) => OwnerKind::Receipt,
        }
    }

    pub fn as_p_k_h(&self) -> Option<Keyhash> {
        match &self.0 {
            projected_nft_structs::Owner::PKH { p_k_h, .. } => Some(p_k_h.clone().into()),
            _ => None,
        }
    }

    pub fn as_n_f_t(&self) -> Option<NFT> {
        match &self.0 {
            projected_nft_structs::Owner::NFT(n_f_t) => Some(n_f_t.clone().into()),
            _ => None,
        }
    }

    pub fn as_receipt(&self) -> Option<AssetName> {
        match &self.0 {
            projected_nft_structs::Owner::Receipt(receipt) => Some(receipt.clone().into()),
            _ => None,
        }
    }
}

impl From<projected_nft_structs::Owner> for Owner {
    fn from(native: projected_nft_structs::Owner) -> Self {
        Self(native)
    }
}

impl From<Owner> for projected_nft_structs::Owner {
    fn from(wasm: Owner) -> Self {
        wasm.0
    }
}

impl AsRef<projected_nft_structs::Owner> for Owner {
    fn as_ref(&self) -> &projected_nft_structs::Owner {
        &self.0
    }
}

#[wasm_bindgen]
pub enum OwnerKind {
    PKH,
    NFT,
    Receipt,
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct State(projected_nft_structs::State);

#[wasm_bindgen]
impl State {
    pub fn to_cbor_bytes(&self) -> Vec<u8> {
        cml_core::serialization::Serialize::to_cbor_bytes(&self.0)
    }

    pub fn from_cbor_bytes(cbor_bytes: &[u8]) -> Result<State, JsValue> {
        cml_core::serialization::Deserialize::from_cbor_bytes(cbor_bytes)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_bytes: {}", e)))
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
        Self(projected_nft_structs::State::new(
            owner.clone().into(),
            status.clone().into(),
        ))
    }
}

impl From<projected_nft_structs::State> for State {
    fn from(native: projected_nft_structs::State) -> Self {
        Self(native)
    }
}

impl From<State> for projected_nft_structs::State {
    fn from(wasm: State) -> Self {
        wasm.0
    }
}

impl AsRef<projected_nft_structs::State> for State {
    fn as_ref(&self) -> &projected_nft_structs::State {
        &self.0
    }
}

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct Status(projected_nft_structs::Status);

#[wasm_bindgen]
impl Status {
    pub fn to_cbor_bytes(&self) -> Vec<u8> {
        cml_core::serialization::Serialize::to_cbor_bytes(&self.0)
    }

    pub fn from_cbor_bytes(cbor_bytes: &[u8]) -> Result<Status, JsValue> {
        cml_core::serialization::Deserialize::from_cbor_bytes(cbor_bytes)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_bytes: {}", e)))
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
        Self(projected_nft_structs::Status::new_locked())
    }

    pub fn new_unlocking(unlocking: &StatusUnlocking) -> Self {
        Self(projected_nft_structs::Status::new_unlocking(
            unlocking.clone().into(),
        ))
    }

    pub fn kind(&self) -> StatusKind {
        match &self.0 {
            projected_nft_structs::Status::Locked { .. } => StatusKind::Locked,
            projected_nft_structs::Status::Unlocking(_) => StatusKind::Unlocking,
        }
    }

    pub fn as_unlocking(&self) -> Option<StatusUnlocking> {
        match &self.0 {
            projected_nft_structs::Status::Unlocking(unlocking) => Some(unlocking.clone().into()),
            _ => None,
        }
    }
}

impl From<projected_nft_structs::Status> for Status {
    fn from(native: projected_nft_structs::Status) -> Self {
        Self(native)
    }
}

impl From<Status> for projected_nft_structs::Status {
    fn from(wasm: Status) -> Self {
        wasm.0
    }
}

impl AsRef<projected_nft_structs::Status> for Status {
    fn as_ref(&self) -> &projected_nft_structs::Status {
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
pub struct StatusUnlocking(projected_nft_structs::StatusUnlocking);

#[wasm_bindgen]
impl StatusUnlocking {
    pub fn to_cbor_bytes(&self) -> Vec<u8> {
        cml_core::serialization::Serialize::to_cbor_bytes(&self.0)
    }

    pub fn from_cbor_bytes(cbor_bytes: &[u8]) -> Result<StatusUnlocking, JsValue> {
        cml_core::serialization::Deserialize::from_cbor_bytes(cbor_bytes)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_bytes: {}", e)))
    }

    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string_pretty(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsValue> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsValue::from_str(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<StatusUnlocking, JsValue> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsValue::from_str(&format!("from_json: {}", e)))
    }

    pub fn out_ref(&self) -> TransactionInput {
        self.0.out_ref.clone().into()
    }

    pub fn for_how_long(&self) -> i64 {
        self.0.for_how_long
    }

    pub fn new(out_ref: &TransactionInput, for_how_long: i64) -> Self {
        Self(projected_nft_structs::StatusUnlocking::new(
            out_ref.clone().into(),
            for_how_long,
        ))
    }
}

impl From<projected_nft_structs::StatusUnlocking> for StatusUnlocking {
    fn from(native: projected_nft_structs::StatusUnlocking) -> Self {
        Self(native)
    }
}

impl From<StatusUnlocking> for projected_nft_structs::StatusUnlocking {
    fn from(wasm: StatusUnlocking) -> Self {
        wasm.0
    }
}

impl AsRef<projected_nft_structs::StatusUnlocking> for StatusUnlocking {
    fn as_ref(&self) -> &projected_nft_structs::StatusUnlocking {
        &self.0
    }
}
