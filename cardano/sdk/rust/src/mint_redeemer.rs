use cml_chain::plutus::{ConstrPlutusData, PlutusData};
use cml_chain::utils::BigInt;
use cml_core::serialization::Deserialize;
use serde::{Deserialize as SerdeDeserialize, Serialize};
use std::fmt::Debug;

#[derive(Clone, Debug, Eq, PartialEq, Hash, SerdeDeserialize, Serialize, schemars::JsonSchema)]
pub enum MintRedeemer {
    MintTokens { total: BigInt },
    BurnTokens,
}

impl MintRedeemer {
    pub fn new_mint(total: BigInt) -> MintRedeemer {
        MintRedeemer::MintTokens { total }
    }

    pub fn new_burn() -> MintRedeemer {
        MintRedeemer::BurnTokens
    }
}

impl From<MintRedeemer> for PlutusData {
    fn from(value: MintRedeemer) -> Self {
        match value {
            MintRedeemer::MintTokens { total } => PlutusData::new_constr_plutus_data(
                ConstrPlutusData::new(0, vec![PlutusData::new_integer(total)]),
            ),
            MintRedeemer::BurnTokens => {
                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(1, vec![]))
            }
        }
    }
}

impl TryFrom<&[u8]> for MintRedeemer {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl TryFrom<PlutusData> for MintRedeemer {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("upper value is not constr".to_string()),
        };

        match constr.alternative {
            0 => match constr.fields.first() {
                Some(PlutusData::Integer(bigint)) => Ok(MintRedeemer::MintTokens {
                    total: bigint.clone(),
                }),
                _ => Err("constr field is not bigint".to_string()),
            },
            1 => Ok(MintRedeemer::BurnTokens),
            _ => Err(format!(
                "constr alternative is not correct {:?}",
                constr.alternative
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::MintRedeemer;
    use cml_chain::{plutus::PlutusData, utils::BigInt};

    #[test]
    fn test_mint_redeemer() {
        let mint_redeemer = vec![
            MintRedeemer::MintTokens {
                total: BigInt::from(253),
            },
            MintRedeemer::BurnTokens,
        ];
        for redeem in mint_redeemer.into_iter() {
            let plutus_datum = PlutusData::from(redeem.clone());
            let convert_back = MintRedeemer::try_from(plutus_datum);
            assert!(convert_back.is_ok(), "{:?}", convert_back.err());
            assert_eq!(convert_back.unwrap(), redeem);
        }
    }
}
