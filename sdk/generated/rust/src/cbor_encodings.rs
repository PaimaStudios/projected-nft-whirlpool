// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use cml_core::serialization::{LenEncoding, StringEncoding};

#[derive(Clone, Debug, Default)]
pub struct MintTokensEncoding {
    pub len_encoding: LenEncoding,
    pub total_encoding: Option<cbor_event::Sz>,
}

#[derive(Clone, Debug, Default)]
pub struct NFTEncoding {
    pub len_encoding: LenEncoding,
    pub policy_id_encoding: StringEncoding,
}

#[derive(Clone, Debug, Default)]
pub struct RedeemEncoding {
    pub len_encoding: LenEncoding,
}

#[derive(Clone, Debug, Default)]
pub struct StateEncoding {
    pub len_encoding: LenEncoding,
}

#[derive(Clone, Debug, Default)]
pub struct UnlockingEncoding {
    pub len_encoding: LenEncoding,
    pub for_how_long_encoding: Option<cbor_event::Sz>,
}
