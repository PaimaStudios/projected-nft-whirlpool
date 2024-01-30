use crate::OutRef;
use cml_chain::assets::AssetName;
use cml_chain::plutus::{ConstrPlutusData, PlutusData};

use cml_core::serialization::Deserialize;
use std::fmt::Debug;

#[derive(
    Clone, Debug, Eq, PartialEq, Hash, serde::Deserialize, serde::Serialize, schemars::JsonSchema,
)]
pub struct Redeem {
    pub partial_withdraw: bool,
    pub nft_input_owner: Option<OutRef>,
    pub new_receipt_owner: Option<AssetName>,
}

impl Redeem {
    pub fn new(
        partial_withdraw: bool,
        nft_input_owner: Option<OutRef>,
        new_receipt_owner: Option<AssetName>,
    ) -> Self {
        Self {
            partial_withdraw,
            nft_input_owner,
            new_receipt_owner,
        }
    }
}

impl TryFrom<&[u8]> for Redeem {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl From<Redeem> for PlutusData {
    fn from(redeem: Redeem) -> Self {
        let partial_withdraw = PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            match redeem.partial_withdraw {
                true => 1,
                false => 0,
            },
            vec![],
        ));

        let nft_input_owner = if let Some(out_ref) = redeem.nft_input_owner {
            PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                0,
                vec![PlutusData::from(out_ref)],
            ))
        } else {
            PlutusData::new_constr_plutus_data(ConstrPlutusData::new(1, vec![]))
        };
        let nft_receipt_owner = if let Some(asset_name) = redeem.new_receipt_owner {
            PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                0,
                vec![PlutusData::new_bytes(asset_name.get().clone())],
            ))
        } else {
            PlutusData::new_constr_plutus_data(ConstrPlutusData::new(1, vec![]))
        };

        let redeemer = PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            0,
            vec![partial_withdraw, nft_input_owner, nft_receipt_owner],
        ));

        PlutusData::new_constr_plutus_data(ConstrPlutusData::new(1, vec![redeemer]))
    }
}

impl TryFrom<PlutusData> for Redeem {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr plutus data for redeem".to_string()),
        };

        if constr.alternative != 1 {
            return Err(format!(
                "expected to see alternative = 1 for redeem, got {}",
                constr.alternative
            ));
        }

        let redeemer_constr = match constr
            .fields
            .first()
            .ok_or("no field found for inner redeem while parsing redeem".to_string())?
        {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => {
                return Err(
                    "expected to see constr plutus data for inner redeem while parsing redeem"
                        .to_string(),
                )
            }
        };

        if redeemer_constr.alternative != 0 {
            return Err(format!(
                "expected to see alternative = 0 for inner redeem, got {}",
                constr.alternative
            ));
        }

        let constr_withdraw = match redeemer_constr.fields.first().ok_or("no field found for partial_withdraw while parsing redeem".to_string())? {
            PlutusData::ConstrPlutusData(constr) => constr.clone(),
            _ => return Err("expected to see constr plutus data for partial_withdraw field while parsing redeem".to_string()),
        };
        let constr_input_owner = match redeemer_constr
            .fields
            .get(1)
            .ok_or("no field found for nft_input_owner while parsing redeem".to_string())?
        {
            PlutusData::ConstrPlutusData(constr) => constr.clone(),
            _ => return Err(
                "expected to see constr plutus data for nft_input_owner field while parsing redeem"
                    .to_string(),
            ),
        };
        let constr_receipt_owner = match redeemer_constr.fields.get(2).ok_or("no field found for new_receipt_owner while parsing redeem".to_string())? {
            PlutusData::ConstrPlutusData(constr) => constr.clone(),
            _ => {
                return Err(
                    "expected to see constr plutus data for new_receipt_owner field while parsing redeem".to_string(),
                )
            }
        };

        let partial_withdraw = get_partial_withdraw(constr_withdraw)
            .map_err(|err| format!("{err} while parsing redeem"))?;
        let nft_input_owner = get_nft_input_owner(constr_input_owner)
            .map_err(|err| format!("{err} while parsing redeem"))?;
        let new_receipt_owner = get_new_receipt_owner(constr_receipt_owner)
            .map_err(|err| format!("{err} while parsing redeem"))?;

        Ok(Redeem {
            partial_withdraw,
            nft_input_owner,
            new_receipt_owner,
        })
    }
}

fn get_partial_withdraw(constr: ConstrPlutusData) -> Result<bool, String> {
    match constr.alternative {
        0 => Ok(false),
        1 => Ok(true),
        _ => Err(format!(
            "expected to see alternative in range 0-1 while parsing partial_withdraw, got {}",
            constr.alternative
        )),
    }
}

fn get_nft_input_owner(constr: ConstrPlutusData) -> Result<Option<OutRef>, String> {
    match constr.alternative {
        0 => OutRef::try_from(constr.fields.first().cloned().ok_or(
            "no field found for output reference while parsing nft_input_owner".to_string(),
        )?)
        .map(Some)
        .map_err(|err| format!("{err} while parsing nft_input_owner")),
        1 => Ok(None),
        _ => Err(format!(
            "expected to see alternative in range 0-1 while parsing nft_input_owner, got {}",
            constr.alternative
        )),
    }
}

fn get_new_receipt_owner(constr: ConstrPlutusData) -> Result<Option<AssetName>, String> {
    match constr.alternative {
        0 => match constr.fields.first().ok_or(
            "no field found for new_receipt_owner while parsing new_receipt_owner".to_string(),
        )? {
            PlutusData::Bytes { bytes, .. } => {
                let asset_name = AssetName::new(bytes.clone())
                    .map_err(|err| format!("can't decode asset name bytes as AssetName while parsing owner 2 (receipt): {err:?}"))?;

                Ok(Some(asset_name))
            }
            _ => Err(
                "expected to see asset name bytes field type while parsing new_receipt_owner"
                    .to_string(),
            ),
        },
        1 => Ok(None),
        _ => Err(format!(
            "expected to see alternative in range 0-2 while parsing new_receipt_owner, got {}",
            constr.alternative
        )),
    }
}

#[cfg(test)]
mod tests {
    use crate::redeem::Redeem;
    use crate::OutRef;
    use cml_chain::assets::AssetName;
    use cml_chain::plutus::PlutusData;
    use cml_core::serialization::Deserialize;
    use cml_crypto::TransactionHash;

    #[test]
    fn test_redeem() {
        let redeem = Redeem {
            partial_withdraw: false,
            nft_input_owner: Some(OutRef {
                tx_id: TransactionHash::from_hex(
                    "54df9f06aed611f1183c2b4534762ad4ee04fffe7fa4bad35c7517c3cf397dd8",
                )
                .unwrap(),
                index: 2,
            }),
            new_receipt_owner: Some(
                AssetName::from_cbor_bytes(
                    &hex::decode("4c6f636b2054657374204e465420436f6e74726f6c").unwrap(),
                )
                .unwrap(),
            ),
        };
        let plutus_datum = PlutusData::from(redeem.clone());
        let convert_back = Redeem::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), redeem);
    }

    #[test]
    fn test_redeem_none() {
        let redeem = Redeem {
            partial_withdraw: true,
            nft_input_owner: None,
            new_receipt_owner: None,
        };
        let plutus_datum = PlutusData::from(redeem.clone());
        let convert_back = Redeem::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), redeem);
    }
}
