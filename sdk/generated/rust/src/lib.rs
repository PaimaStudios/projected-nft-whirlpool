#![allow(clippy::too_many_arguments)]

extern crate derivative;
// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

pub mod cbor_encodings;
pub mod serialization;

use cbor_encodings::{
    MintTokensEncoding, NFTEncoding, RedeemEncoding, StateEncoding, UnlockingEncoding,
};

use cml_chain::transaction::TransactionInput;
use cml_chain::{AssetName, PolicyId};

use cml_core::serialization::{LenEncoding, StringEncoding};
use cml_crypto::Ed25519KeyHash as Keyhash;

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub enum MintRedeemer {
    MintTokens(MintTokens),
    BurnTokens {
        #[serde(skip)]
        burn_tokens_encoding: Option<cbor_event::Sz>,
    },
}

impl MintRedeemer {
    pub fn new_mint_tokens(mint_tokens: MintTokens) -> Self {
        Self::MintTokens(mint_tokens)
    }

    pub fn new_burn_tokens() -> Self {
        Self::BurnTokens {
            burn_tokens_encoding: None,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub struct MintTokens {
    pub total: i64,
    #[serde(skip)]
    pub encodings: Option<MintTokensEncoding>,
}

impl MintTokens {
    pub fn new(total: i64) -> Self {
        Self {
            total,
            encodings: None,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
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

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub enum Owner {
    PKH {
        p_k_h: Keyhash,
        #[serde(skip)]
        p_k_h_encoding: StringEncoding,
    },
    NFT(NFT),
    Receipt(AssetName),
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
        Self::Receipt(receipt)
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub struct Redeem {
    pub partial_withdraw: bool,
    pub nft_input_owner: Option<TransactionInput>,
    pub new_receipt_owner: Option<AssetName>,
    #[serde(skip)]
    pub encodings: Option<RedeemEncoding>,
}

impl Redeem {
    pub fn new(
        partial_withdraw: bool,
        nft_input_owner: Option<TransactionInput>,
        new_receipt_owner: Option<AssetName>,
    ) -> Self {
        Self {
            partial_withdraw,
            nft_input_owner,
            new_receipt_owner,
            encodings: None,
        }
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
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

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub enum Status {
    Locked {
        #[serde(skip)]
        locked_encoding: Option<cbor_event::Sz>,
    },
    Unlocking(Unlocking),
}

impl Status {
    pub fn new_locked() -> Self {
        Self::Locked {
            locked_encoding: None,
        }
    }

    pub fn new_unlocking(unlocking: Unlocking) -> Self {
        Self::Unlocking(unlocking)
    }
}

#[derive(Clone, Debug, serde::Deserialize, serde::Serialize, schemars::JsonSchema)]
pub struct Unlocking {
    pub out_ref: TransactionInput,
    pub for_how_long: i64,
    #[serde(skip)]
    pub encodings: Option<UnlockingEncoding>,
}

impl Unlocking {
    pub fn new(out_ref: TransactionInput, for_how_long: i64) -> Self {
        Self {
            out_ref,
            for_how_long,
            encodings: None,
        }
    }
}
