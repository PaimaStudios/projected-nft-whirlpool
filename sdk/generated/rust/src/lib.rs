#![allow(clippy::too_many_arguments)]

pub mod error;
pub mod ordered_hash_map;
extern crate derivative;
// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

pub mod cbor_encodings;
pub mod serialization;

use crate::error::*;
use crate::serialization::{LenEncoding, RawBytesEncoding, StringEncoding, ToCBORBytes};
use cbor_encodings::{NFTEncoding, StateEncoding, StatusUnlockingEncoding};
use ordered_hash_map::OrderedHashMap;
use std::collections::BTreeMap;
use std::convert::TryFrom;
use cardano_multiplatform_lib::{AssetName, PolicyID as PolicyId, crypto::Ed25519KeyHash as Keyhash, TransactionInput, ledger::common::value::Int as Int64};

impl RawBytesEncoding for AssetName {
    fn to_raw_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError> where Self: Sized {
        AssetName::from_bytes(bytes.to_vec()).map_err(map_cml_error)
    }
}

impl RawBytesEncoding for PolicyId {
    fn to_raw_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError> where Self: Sized {
        PolicyId::from_bytes(bytes.to_vec()).map_err(map_cml_error)
    }
}

impl RawBytesEncoding for TransactionInput {
    fn to_raw_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError> where Self: Sized {
        TransactionInput::from_bytes(bytes.to_vec()).map_err(map_cml_error)
    }
}

impl RawBytesEncoding for Int64 {
    fn to_raw_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError> where Self: Sized {
        Int64::from_bytes(bytes.to_vec()).map_err(map_cml_error)
    }
}

impl RawBytesEncoding for Keyhash {
    fn to_raw_bytes(&self) -> Vec<u8> {
        self.to_bytes()
    }

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError> where Self: Sized {
        Keyhash::from_bytes(bytes.to_vec()).map_err(map_cml_error)
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct NFT {
    pub policy_id: PolicyId,
    pub asset_name: AssetName,
    #[serde(skip)]
    pub encodings: Option<NFTEncoding>,
}

impl NFT {
    pub fn new(policy_id: PolicyId, asset_name: AssetName) -> Self {
        Self {
            policy_id,
            asset_name,
            encodings: None,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Owner {
    PKH {
        p_k_h: Keyhash,
        #[serde(skip)]
        p_k_h_encoding: StringEncoding,
    },
    NFT(NFT),
    Receipt {
        receipt: AssetName,
        #[serde(skip)]
        receipt_encoding: StringEncoding,
    },
}

impl Owner {
    pub fn new_p_k_h(p_k_h: Keyhash) -> Self {
        Self::PKH {
            p_k_h,
            p_k_h_encoding: StringEncoding::default(),
        }
    }

    pub fn new_n_f_t(n_f_t: NFT) -> Self {
        Self::NFT(n_f_t)
    }

    pub fn new_receipt(receipt: AssetName) -> Self {
        Self::Receipt {
            receipt,
            receipt_encoding: StringEncoding::default(),
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct State {
    pub owner: Owner,
    pub status: Status,
    #[serde(skip)]
    pub encodings: Option<StateEncoding>,
}

impl State {
    pub fn new(owner: Owner, status: Status) -> Self {
        Self {
            owner,
            status,
            encodings: None,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub enum Status {
    Locked {
        #[serde(skip)]
        locked_encoding: Option<cbor_event::Sz>,
    },
    Unlocking(StatusUnlocking),
}

impl Status {
    pub fn new_locked() -> Self {
        Self::Locked {
            locked_encoding: None,
        }
    }

    pub fn new_unlocking(unlocking: StatusUnlocking) -> Self {
        Self::Unlocking(unlocking)
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize)]
pub struct StatusUnlocking {
    pub out_ref: TransactionInput,
    pub for_how_long: Int64,
    #[serde(skip)]
    pub encodings: Option<StatusUnlockingEncoding>,
}

impl StatusUnlocking {
    pub fn new(out_ref: TransactionInput, for_how_long: Int64) -> Self {
        Self {
            out_ref,
            for_how_long,
            encodings: None,
        }
    }
}
