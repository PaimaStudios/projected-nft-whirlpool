use cml_chain::plutus::{ConstrPlutusData, PlutusData};
use cml_chain::utils::BigInt;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub struct State {
    pub owner: Owner,
    pub status: Status,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum Owner {
    PKH(Vec<u8>),
    NFT(Vec<u8>, Vec<u8>),
    Receipt(Vec<u8>),
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub struct OutRef {
    pub tx_id: Vec<u8>,
    pub index: u64,
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum Status {
    Locked,
    Unlocking { out_ref: OutRef, for_how_long: u64 },
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub struct Redeem {
    pub partial_withdraw: bool,
    pub nft_input_owner: Option<OutRef>,
    pub new_receipt_owner: Option<Vec<u8>>,
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
                vec![PlutusData::new_bytes(asset_name)],
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
            _ => return Err("upper value is not constr".to_string()),
        };
        if constr.alternative != 1 {
            return Err(format!("expected constr = 1 got {:?}", constr.alternative));
        }
        let redeemer_constr = match constr.fields.get(0).ok_or(format!(
            "expected constr.fields.len = 1 got {}",
            constr.fields.len()
        ))? {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => {
                return Err(format!(
                    "expected constr.fields.[0] to be constr, got {:?}",
                    constr.fields.get(0)
                ))
            }
        };

        let constr_withdraw = match redeemer_constr.fields.get(0) {
            Some(PlutusData::ConstrPlutusData(constr)) => constr.clone(),
            _ => return Err("Can't parse constr withdraw: plutus data is not constr".to_string()),
        };
        let constr_input_owner = match redeemer_constr.fields.get(1) {
            Some(PlutusData::ConstrPlutusData(constr)) => constr.clone(),
            _ => {
                return Err(
                    "Can't parse constr nft input owner: plutus data is not constr".to_string(),
                )
            }
        };
        let constr_receipt_owner = match redeemer_constr.fields.get(2) {
            Some(PlutusData::ConstrPlutusData(constr)) => constr.clone(),
            _ => {
                return Err(
                    "Can't parse constr new receipt owner: plutus data is not constr".to_string(),
                )
            }
        };

        let partial_withdraw = get_partial_withdraw(constr_withdraw)?;
        let nft_input_owner = get_nft_input_owner(constr_input_owner)?;
        let new_receipt_owner = get_new_receipt_owner(constr_receipt_owner)?;

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
        _ => Err(format!("improper constr: {:?}", constr.alternative)),
    }
}

fn get_nft_input_owner(constr: ConstrPlutusData) -> Result<Option<OutRef>, String> {
    match constr.alternative {
        0 => OutRef::try_from(
            constr
                .fields
                .get(0)
                .cloned()
                .ok_or("no owner fileds found".to_string())?,
        )
        .map(Some),
        1 => Ok(None),
        _ => Err(format!(
            "nft_input_owner: expected to see other constr {:?}",
            constr.alternative
        )),
    }
}

fn get_new_receipt_owner(constr: ConstrPlutusData) -> Result<Option<Vec<u8>>, String> {
    match constr.alternative {
        0 => match constr.fields.get(0) {
            Some(PlutusData::Bytes {
                bytes,
                bytes_encoding: _,
            }) => Ok(Some(bytes.clone())),
            _ => Err("new_receipt_owner: expected to see bytes".to_string()),
        },
        1 => Ok(None),
        _ => Err(format!(
            "new_receipt_owner: expected to see other constr {:?}",
            constr.alternative
        )),
    }
}

impl From<State> for PlutusData {
    fn from(state: State) -> Self {
        let owner_data = match state.owner {
            Owner::PKH(pkh) => PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                0,
                vec![PlutusData::new_bytes(pkh)],
            )),
            Owner::NFT(policy_id, asset_name) => {
                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                    1,
                    vec![
                        PlutusData::new_bytes(policy_id),
                        PlutusData::new_bytes(asset_name),
                    ],
                ))
            }
            Owner::Receipt(asset_name) => PlutusData::new_constr_plutus_data(
                ConstrPlutusData::new(2, vec![PlutusData::new_bytes(asset_name)]),
            ),
        };

        let status = match state.status {
            Status::Locked => PlutusData::new_constr_plutus_data(ConstrPlutusData::new(0, vec![])),
            Status::Unlocking {
                out_ref,
                for_how_long,
            } => {
                let out_ref = PlutusData::from(out_ref);

                let for_how_long = PlutusData::new_big_int(BigInt::from(for_how_long));

                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                    1,
                    vec![out_ref, for_how_long],
                ))
            }
        };

        PlutusData::new_constr_plutus_data(ConstrPlutusData::new(0, vec![owner_data, status]))
    }
}

impl TryFrom<PlutusData> for State {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr".to_string()),
        };

        let constr_owner = match constr.fields.get(0) {
            Some(PlutusData::ConstrPlutusData(constr)) => constr.clone(),
            _ => return Err("expected to see constr to parse owner".to_string()),
        };
        let constr_status = match constr.fields.get(1) {
            Some(PlutusData::ConstrPlutusData(constr)) => constr.clone(),
            _ => return Err("expected to see constr to parse status".to_string()),
        };

        let owner = get_owner(constr_owner)?;
        let status = get_status(constr_status)?;

        Ok(State { owner, status })
    }
}

fn get_owner(constr: ConstrPlutusData) -> Result<Owner, String> {
    match constr.alternative {
        0 => match constr.fields.get(0) {
            Some(PlutusData::Bytes {
                bytes,
                bytes_encoding: _,
            }) => Ok(Owner::PKH(bytes.clone())),
            _ => Err("PKH parse error".to_string()),
        },
        1 => {
            let policy_id = match constr.fields.get(0) {
                Some(PlutusData::Bytes {
                    bytes,
                    bytes_encoding: _,
                }) => bytes.clone(),
                _ => {
                    return Err("NFT PolicyID parse error".to_string());
                }
            };
            let asset_name = match constr.fields.get(1) {
                Some(PlutusData::Bytes {
                    bytes,
                    bytes_encoding: _,
                }) => bytes.clone(),
                _ => {
                    return Err("NFT asset name parse error".to_string());
                }
            };
            Ok(Owner::NFT(policy_id, asset_name))
        }
        2 => {
            let asset_name = match constr.fields.get(0) {
                Some(PlutusData::Bytes {
                    bytes,
                    bytes_encoding: _,
                }) => bytes.clone(),
                _ => {
                    return Err("Receipt asset name parse error".to_string());
                }
            };
            Ok(Owner::Receipt(asset_name))
        }
        _ => Err(format!(
            "Owner parse error: invalid constr {:?}",
            constr.alternative
        )),
    }
}

fn get_status(constr: ConstrPlutusData) -> Result<Status, String> {
    match constr.alternative {
        0 => Ok(Status::Locked),
        1 => {
            let out_ref = OutRef::try_from(
                constr
                    .fields
                    .get(0)
                    .cloned()
                    .ok_or("no fields found for status")?,
            )?;
            let for_how_long = match constr.fields.get(1) {
                Some(PlutusData::BigInt(bigint)) => bigint
                    .as_u64()
                    .ok_or("can't convert bigint to u64".to_string())?,
                _ => {
                    return Err("for how long unlocking parse error".to_string());
                }
            };
            Ok(Status::Unlocking {
                out_ref,
                for_how_long,
            })
        }
        _ => Err(format!(
            "status parse error: invalid constr {:?}",
            constr.alternative
        )),
    }
}

impl TryFrom<PlutusData> for OutRef {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("value is not constr plutus data".to_string()),
        };

        get_out_ref(constr)
    }
}

impl From<OutRef> for PlutusData {
    fn from(out_ref: OutRef) -> Self {
        let transaction_id = PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            0,
            vec![PlutusData::new_bytes(out_ref.tx_id)],
        ));

        let output_index = PlutusData::new_big_int(BigInt::from(out_ref.index));

        PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
            0,
            vec![transaction_id, output_index],
        ))
    }
}

fn get_out_ref(constr: ConstrPlutusData) -> Result<OutRef, String> {
    if constr.alternative != 0 {
        return Err(format!(
            "OutRef parse error: invalid constr {:?}",
            constr.alternative
        ));
    }
    if constr.fields.len() != 2 {
        return Err(format!(
            "OutRef parse error: invalid fields len {}",
            constr.fields.len()
        ));
    }
    let transaction_id = match constr.fields.get(0) {
        Some(PlutusData::ConstrPlutusData(constr)) => {
            if constr.alternative != 0 || constr.fields.len() != 1 {
                return Err(format!(
                    "OutRef parse error: constr or fields len {:?}, {}",
                    constr.alternative,
                    constr.fields.len()
                ));
            }
            match constr.fields.get(0) {
                Some(PlutusData::Bytes {
                    bytes,
                    bytes_encoding: _,
                }) => bytes.clone(),
                _ => return Err("OutRef parse error: tx bytes are not found".to_string()),
            }
        }
        _ => return Err("OutRef parse error: tx bytes are not found".to_string()),
    };
    let output_index = match constr.fields.get(1) {
        Some(PlutusData::BigInt(index)) => index
            .as_u64()
            .ok_or("can't convert bigint to u64".to_string())?,
        _ => return Err("OutRef parse error: output index is not found".to_string()),
    };
    Ok(OutRef {
        tx_id: transaction_id,
        index: output_index,
    })
}

#[cfg(test)]
mod tests {
    use crate::conversions::{MintRedeemer, OutRef, Owner, Redeem, State, Status};
    use cml_chain::plutus::PlutusData;

    #[test]
    fn test_datum_pkh() {
        let datum = State {
            owner: Owner::PKH(vec![]),
            status: Status::Locked,
        };
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = State::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_nft() {
        let datum = State {
            owner: Owner::NFT(vec![1], vec![2]),
            status: Status::Locked,
        };
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = State::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_receipt() {
        let datum = State {
            owner: Owner::Receipt(vec![2]),
            status: Status::Locked,
        };
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = State::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_unlock() {
        let datum = State {
            owner: Owner::Receipt(vec![2]),
            status: Status::Unlocking {
                out_ref: OutRef {
                    tx_id: vec![3, 4, 5],
                    index: 2,
                },
                for_how_long: 300,
            },
        };
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = State::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_redeem() {
        let redeem = Redeem {
            partial_withdraw: false,
            nft_input_owner: Some(OutRef {
                tx_id: vec![3, 4, 5],
                index: 2,
            }),
            new_receipt_owner: Some(vec![1, 2, 3, 7]),
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
