use std::fmt::format;
use cardano_serialization_lib::plutus::{ConstrPlutusData, PlutusData, PlutusList};
use cardano_serialization_lib::utils::{BigInt, BigNum};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum ProjectedNFTDatums {
    State(State),
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum ProjectedNFTRedeemers {
    Redeem(Redeem),
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum MintRedeemer {
    MintTokens { total: u64 },
    BurnTokens,
}

impl From<MintRedeemer> for PlutusData {
    fn from(value: MintRedeemer) -> Self {
        match value {
            MintRedeemer::MintTokens { total } => {
                let mut list = PlutusList::new();
                list.add(&PlutusData::new_integer(&BigInt::from(BigNum::from(total))));

                PlutusData::new_constr_plutus_data(
                    &ConstrPlutusData::new(
                        &BigNum::zero(),
                        &list,
                    )
                )
            }
            MintRedeemer::BurnTokens => {
                PlutusData::new_constr_plutus_data(
                    &ConstrPlutusData::new(
                        &BigNum::one(),
                        &PlutusList::new(),
                    )
                )
            }
        }
    }
}

impl TryFrom<PlutusData> for MintRedeemer {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let Some(constr) = value.as_constr_plutus_data() else {
            return Err("upper value is not constr".to_string())
        };

        match u64::from(constr.alternative()) {
            0 => match constr.data().get(0).as_integer() {
                Some(bigint) => Ok(MintRedeemer::MintTokens {
                    total: u64::from(bigint.as_u64().ok_or(format!("Mint tokens total valus can't be represented as u64"))?),
                }),
                _ => return Err("constr field is not bigint".to_string()),
            }
            1 => Ok(MintRedeemer::BurnTokens),
            _ => return Err(format!("constr alternative is not correct {}", constr.alternative())),
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
    Unlocking {
        out_ref: OutRef,
        for_how_long: u64,
    }
}

#[derive(Debug, Clone, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub struct Redeem {
    pub partial_withdraw: bool,
    pub nft_input_owner: Option<OutRef>,
    pub new_receipt_owner: Option<Vec<u8>>,
}

impl From<Redeem> for ProjectedNFTRedeemers {
    fn from(value: Redeem) -> Self {
        ProjectedNFTRedeemers::Redeem(value)
    }
}

impl From<ProjectedNFTRedeemers> for PlutusData {
    fn from(value: ProjectedNFTRedeemers) -> Self {
        let redeem = match value { ProjectedNFTRedeemers::Redeem(redeem) =>
            redeem
        };

        let partial_withdraw = PlutusData::new_constr_plutus_data(
            &ConstrPlutusData::new(
                &match redeem.partial_withdraw {
                    true => BigNum::one(),
                    false => BigNum::zero(),
                },
                &PlutusList::new(),
            )
        );

        let nft_input_owner = if let Some(out_ref) = redeem.nft_input_owner {
            let out_ref= PlutusData::from(out_ref);

            let mut list = PlutusList::new();
            list.add(&out_ref);

            PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                &BigNum::zero(),
                &list,
            ))
        } else {
            PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                &BigNum::one(),
                &PlutusList::new(),
            ))
        };
        let nft_receipt_owner = if let Some(asset_name) = redeem.new_receipt_owner {
            let mut list = PlutusList::new();
            list.add(&PlutusData::new_bytes(asset_name));

            PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                &BigNum::zero(),
                &list,
            ))
        } else {
            PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                &BigNum::one(),
                &PlutusList::new(),
            ))
        };
        let mut list = PlutusList::new();
        list.add(&partial_withdraw);
        list.add(&nft_input_owner);
        list.add(&nft_receipt_owner);

        let redeemer = PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
            &BigNum::zero(),
            &list,
        ));

        let mut list = PlutusList::new();
        list.add(&redeemer);

        PlutusData::new_constr_plutus_data(
            &ConstrPlutusData::new(
                &BigNum::one(),
                &list,
            )
        )
    }
}

impl TryFrom<PlutusData> for ProjectedNFTRedeemers {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let Some(constr) = value.as_constr_plutus_data() else {
            return Err("upper value is not constr".to_string())
        };
        if constr.alternative() != BigNum::one() {
            return Err(format!("expected constr = 1 got {}", constr.alternative()))
        }
        let Some(redeemer_constr) = constr.data().get(0).as_constr_plutus_data() else {
            return Err(format!("expected constr.fields.len = 1 got {}", constr.data().len()))
        };

        let Some(constr_withdraw) = redeemer_constr.data().get(0).as_constr_plutus_data() else { return Err(format!("can't parse withdraw"))};
        let Some(constr_input_owner) = redeemer_constr.data().get(1).as_constr_plutus_data() else { return Err(format!("can't parse nft input owner"))};
        let Some(constr_receipt_owner) = redeemer_constr.data().get(2).as_constr_plutus_data() else { return Err(format!("can't parse new receipt owner: no field"))};

        let partial_withdraw = get_partial_withdraw(constr_withdraw)?;
        let nft_input_owner = get_nft_input_owner(constr_input_owner)?;
        let new_receipt_owner = get_new_receipt_owner(constr_receipt_owner)?;

        Ok(ProjectedNFTRedeemers::Redeem(Redeem {
            partial_withdraw,
            nft_input_owner,
            new_receipt_owner,
        }))
    }
}


fn get_partial_withdraw(constr: ConstrPlutusData) -> Result<bool, String> {
    match u64::from(constr.alternative()) {
        0 => Ok(false),
        1 => Ok(true),
        _ => Err(format!("improper constr: {}", constr.alternative()))
    }
}

fn get_nft_input_owner(constr: ConstrPlutusData) -> Result<Option<OutRef>, String> {
    match u64::from(constr.alternative()) {
        0 => {
            OutRef::try_from(constr.data().get(0)).map(|res| Some(res))
        }
        1 => {
            Ok(None)
        }
        _ => Err(format!("nft_input_owner: expected to see other constr {}", constr.alternative()))
    }
}

fn get_new_receipt_owner(constr: ConstrPlutusData) -> Result<Option<Vec<u8>>, String> {
    match u64::from(constr.alternative()) {
        0 => {
            match constr.data().get(0).as_bytes() {
                Some(bytes) => Ok(Some(bytes)),
                _ => Err(format!("new_receipt_owner: expected to see bytes"))
            }
        }
        1 => {
            Ok(None)
        }
        _ => Err(format!("new_receipt_owner: expected to see other constr {}", constr.alternative()))
    }
}

impl From<State> for ProjectedNFTDatums {
    fn from(value: State) -> Self {
        ProjectedNFTDatums::State(value)
    }
}

impl From<ProjectedNFTDatums> for PlutusData {
    fn from(value: ProjectedNFTDatums) -> Self {
        let state = match value {
            ProjectedNFTDatums::State(state) => {
                state
            }
        };

        let owner_data = match state.owner {
            Owner::PKH(pkh) => {
                let mut list = PlutusList::new();
                list.add(&PlutusData::new_bytes(pkh));

                PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                    &BigNum::zero(),
                    &list,
                ))
            }
            Owner::NFT(policy_id, asset_name) => {
                let mut list = PlutusList::new();
                list.add(&PlutusData::new_bytes(policy_id));
                list.add(&PlutusData::new_bytes(asset_name));

                PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                    &BigNum::one(),
                    &list,
                ))
            }
            Owner::Receipt(asset_name) => {
                let mut list = PlutusList::new();
                list.add(&PlutusData::new_bytes(asset_name));

                PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                    &BigNum::from(2u64),
                    &list,
                ))
            }
        };

        let status = match state.status {
            Status::Locked => {
                PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                    &BigNum::zero(),
                    &PlutusList::new(),
                ))
            }
            Status::Unlocking { out_ref, for_how_long } => {
                let out_ref = PlutusData::from(out_ref);

                let for_how_long = PlutusData::new_integer(&BigInt::from(BigNum::from(for_how_long)));

                let mut list = PlutusList::new();
                list.add(&out_ref);
                list.add(&for_how_long);

                PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
                    &BigNum::one(),
                    &list
                ))
            }
        };

        let mut list = PlutusList::new();
        list.add(&owner_data);
        list.add(&status);


        PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
            &BigNum::zero(),
            &list,
        ))
    }
}

impl TryFrom<PlutusData> for ProjectedNFTDatums {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let Some(constr) = value.as_constr_plutus_data() else {
            return Err(format!("expected to see constr"))
        };

        let Some(constr_owner) = constr.data().get(0).as_constr_plutus_data() else { return Err(format!("owner parse error"))};
        let Some(constr_status) = constr.data().get(1).as_constr_plutus_data() else { return Err(format!("status parse error"))};

        let owner = get_owner(constr_owner)?;
        let status = get_status(constr_status)?;

        Ok(ProjectedNFTDatums::State(State {
            owner,
            status,
        }))
    }
}

fn get_owner(constr: ConstrPlutusData) -> Result<Owner, String> {
    match u64::from(constr.alternative()) {
        0 => match constr.data().get(0).as_bytes() {
            Some(bytes) => {
                Ok(Owner::PKH(bytes))
            }
            _ => {
                return Err(format!("PKH parse error"));
            }
        },
        1 => {
            let policy_id = match constr.data().get(0).as_bytes() {
                Some(bytes) => {
                    bytes
                }
                _ => {
                    return Err(format!("NFT PolicyID parse error"));
                }
            };
            let asset_name = match constr.data().get(1).as_bytes() {
                Some(bytes) => {
                    bytes
                }
                _ => {
                    return Err(format!("NFT asset name parse error"));
                }
            };
            Ok(Owner::NFT(policy_id, asset_name))
        },
        2 => {
            let asset_name = match constr.data().get(0).as_bytes() {
                Some(bytes) => {
                    bytes
                }
                _ => {
                    return Err(format!("Receipt asset name parse error"));
                }
            };
            Ok(Owner::Receipt(asset_name))
        },
        _ => {
            return Err(format!("Owner parse error: invalid constr {}", constr.alternative()));
        }
    }
}

fn get_status(constr: ConstrPlutusData) -> Result<Status, String> {
    match u64::from(constr.alternative()) {
        0 => Ok(Status::Locked),
        1 => {
            let out_ref = OutRef::try_from(constr.data().get(0))?;
            let for_how_long = match constr.data().get(1).as_integer() {
                Some(bigint) => {
                    bigint.as_u64().ok_or(format!("can't convert bigint to u64"))?.into()
                }
                _ => {
                    return Err(format!("for how long unlocking parse error"));
                }
            };
            Ok(Status::Unlocking {
                out_ref,
                for_how_long,
            })
        },
        _ => {
            return Err(format!("status parse error: invalid constr {}", constr.alternative()));
        }
    }
}

impl TryFrom<PlutusData> for OutRef {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value.as_constr_plutus_data() {
            None => return Err("value is not constr plutus data".to_string()),
            Some(constr) => constr,
        };

        get_out_ref(constr)
    }
}

impl From<OutRef> for PlutusData {
    fn from(out_ref: OutRef) -> Self {
        let mut list = PlutusList::new();
        list.add(&PlutusData::new_bytes(out_ref.tx_id));

        let transaction_id = PlutusData::new_constr_plutus_data(&ConstrPlutusData::new(
            &BigNum::zero(),
            &list,
        ));

        let output_index = PlutusData::new_integer(&BigInt::from(BigNum::from(out_ref.index)));

        let mut list = PlutusList::new();
        list.add(&transaction_id);
        list.add(&output_index);

        let out_ref = PlutusData::new_constr_plutus_data(
            &ConstrPlutusData::new(
                &BigNum::zero(),
                &list,
            )
        );
        out_ref
    }
}

fn get_out_ref(constr: ConstrPlutusData) -> Result<OutRef, String> {
    if constr.alternative() != BigNum::zero() {
        return Err(format!("OutRef parse error: invalid constr {}", constr.alternative()));
    }
    if constr.data().len() != 2 {
        return Err(format!("OutRef parse error: invalid fields len {}", constr.data().len()));
    }
    let transaction_id = match constr.data().get(0).as_constr_plutus_data() {
        Some(constr) => {
            if constr.alternative() != BigNum::zero() || constr.data().len() != 1 {
                return Err(format!("OutRef parse error: constr or fields len {}, {}", constr.alternative(), constr.data().len()));
            }
            match constr.data().get(0).as_bytes() {
                Some(bytes) => {
                    bytes
                }
                _ => return Err(format!("OutRef parse error: tx bytes are not found"))
            }
        }
        _ => return Err(format!("OutRef parse error: tx bytes are not found"))
    };
    let output_index = match constr.data().get(1).as_integer() {
        Some(index) => {
            u64::from(index.as_u64().ok_or(format!("can't convert bigint to u64"))?)
        }
        _ => return Err(format!("OutRef parse error: output index is not found"))
    };
    Ok(OutRef {
        tx_id: transaction_id,
        index: output_index,
    })
}

#[cfg(test)]
mod tests {
    use cardano_serialization_lib::plutus::PlutusData;
    use crate::conversions::{MintRedeemer, OutRef, Owner, ProjectedNFTDatums, ProjectedNFTRedeemers, Redeem, State, Status};

    #[test]
    fn test_datum_pkh() {
        let datum = ProjectedNFTDatums::State(State {
            owner: Owner::PKH(vec![]),
            status: Status::Locked,
        });
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = ProjectedNFTDatums::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_nft() {
        let datum = ProjectedNFTDatums::State(State {
            owner: Owner::NFT(vec![1], vec![2]),
            status: Status::Locked,
        });
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = ProjectedNFTDatums::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_receipt() {
        let datum = ProjectedNFTDatums::State(State {
            owner: Owner::Receipt(vec![2]),
            status: Status::Locked,
        });
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = ProjectedNFTDatums::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_datum_unlock() {
        let datum = ProjectedNFTDatums::State(State {
            owner: Owner::Receipt(vec![2]),
            status: Status::Unlocking {
                out_ref: OutRef {
                    tx_id: vec![3, 4, 5],
                    index: 2,
                },
                for_how_long: 300,
            },
        });
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = ProjectedNFTDatums::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }

    #[test]
    fn test_redeem() {
        let redeem = ProjectedNFTRedeemers::Redeem(Redeem {
            partial_withdraw: false,
            nft_input_owner: Some(
                OutRef {
                    tx_id: vec![3, 4, 5],
                    index: 2,
                },
            ),
            new_receipt_owner: Some(
                vec![1, 2, 3, 7],
            ),
        });
        let plutus_datum = PlutusData::from(redeem.clone());
        let convert_back = ProjectedNFTRedeemers::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), redeem);
    }

    #[test]
    fn test_redeem_none() {
        let redeem = ProjectedNFTRedeemers::Redeem(Redeem {
            partial_withdraw: true,
            nft_input_owner: None,
            new_receipt_owner: None,
        });
        let plutus_datum = PlutusData::from(redeem.clone());
        let convert_back = ProjectedNFTRedeemers::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), redeem);
    }

    #[test]
    fn test_mint_redeemer() {
        let mint_redeemer = vec![MintRedeemer::MintTokens { total: 253 }, MintRedeemer::BurnTokens];
        for redeem in mint_redeemer.into_iter() {
            let plutus_datum = PlutusData::from(redeem.clone());
            let convert_back = MintRedeemer::try_from(plutus_datum);
            assert!(convert_back.is_ok(), "{:?}", convert_back.err());
            assert_eq!(convert_back.unwrap(), redeem);

        }
    }
}
