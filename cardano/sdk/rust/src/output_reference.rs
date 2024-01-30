use cml_chain::plutus::{ConstrPlutusData, PlutusData};
use cml_chain::utils::BigInt;

use cml_core::serialization::Deserialize;
use cml_crypto::{RawBytesEncoding, TransactionHash};
use serde::{Deserialize as SerdeDeserialize, Serialize};
use std::fmt::Debug;

#[derive(Clone, Debug, Eq, PartialEq, Hash, SerdeDeserialize, Serialize, schemars::JsonSchema)]
pub struct OutRef {
    pub tx_id: TransactionHash,
    pub index: u64,
}

impl OutRef {
    pub fn new(tx_id: TransactionHash, index: u64) -> Self {
        OutRef { tx_id, index }
    }
}

impl TryFrom<&[u8]> for OutRef {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl TryFrom<PlutusData> for OutRef {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr plutus data for out ref".to_string()),
        };

        get_out_ref(constr)
    }
}

impl From<OutRef> for PlutusData {
    fn from(out_ref: OutRef) -> Self {
        let transaction_id = PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            0,
            vec![PlutusData::new_bytes(out_ref.tx_id.to_raw_bytes().to_vec())],
        ));

        let output_index = PlutusData::new_integer(BigInt::from(out_ref.index));

        PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            0,
            vec![transaction_id, output_index],
        ))
    }
}

fn get_out_ref(constr: ConstrPlutusData) -> Result<OutRef, String> {
    if constr.alternative != 0 {
        return Err(format!(
            "expected to see alternative = 0 for out ref, got {}",
            constr.alternative
        ));
    }
    let transaction_id = match constr.fields.first().ok_or("no field found for transaction id while parsing out ref")? {
        PlutusData::ConstrPlutusData(constr) => {
            if constr.alternative != 0 {
                return Err(format!(
                    "expected to see alternative = 0 for transaction id, got {} while parsing out ref",
                    constr.alternative
                ));
            }
            match constr.fields.first().ok_or("no field found for transaction id bytes while parsing transaction id while parsing out ref")? {
                PlutusData::Bytes {
                    bytes,
                    ..
                } => bytes.clone(),
                _ => return Err("expected to see bytes field type for transaction id bytes while parsing transaction id while parsing out ref".to_string()),
            }
        }
        _ => return Err("expected to see constr plutus data field type for transaction id while parsing out ref".to_string()),
    };
    let output_index = match constr
        .fields
        .get(1)
        .ok_or("no field found for output index while parsing out ref")?
    {
        PlutusData::Integer(index) => index.as_u64().ok_or(format!(
            "can't convert output index bigint {} to u64 while parsing unlocking status",
            index
        ))?,
        _ => {
            return Err(
                "expected to see bigint field type for output index while parsing out ref"
                    .to_string(),
            )
        }
    };
    Ok(OutRef {
        tx_id: TransactionHash::from_raw_bytes(&transaction_id)
            .map_err(|err| format!("can't parse transaction id: {err:?} while parsing out ref"))?,
        index: output_index,
    })
}
