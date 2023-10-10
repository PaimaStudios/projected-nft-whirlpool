use cml_chain::plutus::{ConstrPlutusData, PlutusData};
use cml_chain::utils::BigInt;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Clone, Debug, Eq, PartialEq, Hash, Deserialize, Serialize, schemars::JsonSchema)]
pub enum MintRedeemer {
    MintTokens { total: u64 },
    BurnTokens,
}

impl MintRedeemer {
    pub fn new_mint(total: u64) -> MintRedeemer {
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
                ConstrPlutusData::new(0, vec![PlutusData::new_big_int(BigInt::from(total))]),
            ),
            MintRedeemer::BurnTokens => {
                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(1, vec![]))
            }
        }
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
            0 => match constr.fields.get(0) {
                Some(PlutusData::BigInt(bigint)) => Ok(MintRedeemer::MintTokens {
                    total: bigint
                        .as_u64()
                        .ok_or("Mint tokens total valus can't be represented as u64".to_string())?,
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
    use cml_chain::plutus::PlutusData;

    #[test]
    fn test_mint_redeemer() {
        let mint_redeemer = vec![
            MintRedeemer::MintTokens { total: 253 },
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
