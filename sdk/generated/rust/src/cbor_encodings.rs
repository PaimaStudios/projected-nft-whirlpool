// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use crate::serialization::{LenEncoding, StringEncoding};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Default)]
pub struct NFTEncoding {
    pub len_encoding: LenEncoding,
    pub policy_id_encoding: StringEncoding,
    pub asset_name_encoding: StringEncoding,
}

#[derive(Clone, Debug, Default)]
pub struct StateEncoding {
    pub len_encoding: LenEncoding,
}

#[derive(Clone, Debug, Default)]
pub struct StatusUnlockingEncoding {
    pub len_encoding: LenEncoding,
    pub orig_deser_order: Vec<usize>,
    pub out_ref_encoding: StringEncoding,
    pub out_ref_key_encoding: StringEncoding,
    pub for_how_long_encoding: StringEncoding,
    pub for_how_long_key_encoding: StringEncoding,
}
