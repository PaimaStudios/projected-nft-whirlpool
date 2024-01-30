use crate::OutRef;
use cml_chain::assets::AssetName;
use cml_chain::plutus::{ConstrPlutusData, PlutusData};
use cml_chain::utils::BigInt;
use cml_chain::PolicyId;

use cml_core::serialization::Deserialize;
use cml_crypto::{Ed25519KeyHash, RawBytesEncoding};
use std::fmt::Debug;

#[derive(
    Clone, Debug, Eq, PartialEq, Hash, serde::Deserialize, serde::Serialize, schemars::JsonSchema,
)]
pub enum Owner {
    PKH(Ed25519KeyHash),
    NFT(PolicyId, AssetName),
    Receipt(AssetName),
}

impl Owner {
    pub fn new_keyhash(keyhash: Ed25519KeyHash) -> Self {
        Self::PKH(keyhash)
    }

    pub fn new_nft(policy_id: PolicyId, asset_name: AssetName) -> Self {
        Self::NFT(policy_id, asset_name)
    }

    pub fn new_receipt(asset_name: AssetName) -> Self {
        Self::Receipt(asset_name)
    }
}

impl From<Owner> for PlutusData {
    fn from(owner: Owner) -> Self {
        match owner {
            Owner::PKH(pkh) => PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                0,
                vec![PlutusData::new_bytes(pkh.to_raw_bytes().to_vec())],
            )),
            Owner::NFT(policy_id, asset_name) => {
                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                    1,
                    vec![
                        PlutusData::new_bytes(policy_id.to_raw_bytes().to_vec()),
                        PlutusData::new_bytes(asset_name.get().clone()),
                    ],
                ))
            }
            Owner::Receipt(asset_name) => PlutusData::new_constr_plutus_data(
                ConstrPlutusData::new(2, vec![PlutusData::new_bytes(asset_name.get().clone())]),
            ),
        }
    }
}

impl TryFrom<&[u8]> for Owner {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl TryFrom<PlutusData> for Owner {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr plutus data while parsing owner".to_string()),
        };

        get_owner(constr)
    }
}

#[derive(
    Clone, Debug, Eq, PartialEq, Hash, serde::Deserialize, serde::Serialize, schemars::JsonSchema,
)]
pub enum Status {
    Locked,
    Unlocking {
        out_ref: OutRef,
        for_how_long: BigInt,
    },
}

impl Status {
    pub fn new_locked() -> Self {
        Self::Locked
    }

    pub fn new_unlocking(out_ref: OutRef, for_how_long: BigInt) -> Self {
        Self::Unlocking {
            out_ref,
            for_how_long,
        }
    }
}

impl From<Status> for PlutusData {
    fn from(status: Status) -> Self {
        match status {
            Status::Locked => PlutusData::new_constr_plutus_data(ConstrPlutusData::new(0, vec![])),
            Status::Unlocking {
                out_ref,
                for_how_long,
            } => {
                let out_ref = PlutusData::from(out_ref);

                let for_how_long = PlutusData::new_integer(for_how_long);

                PlutusData::new_constr_plutus_data(ConstrPlutusData::new(
                    1,
                    vec![out_ref, for_how_long],
                ))
            }
        }
    }
}

impl TryFrom<&[u8]> for Status {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl TryFrom<PlutusData> for Status {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr plutus data while parsing status".to_string()),
        };

        get_status(constr)
    }
}

#[derive(
    Clone, Debug, Eq, PartialEq, Hash, serde::Deserialize, serde::Serialize, schemars::JsonSchema,
)]
pub struct State {
    pub owner: Owner,
    pub status: Status,
}

impl State {
    pub fn new(owner: Owner, status: Status) -> Self {
        Self { owner, status }
    }
}

impl From<State> for PlutusData {
    fn from(state: State) -> Self {
        let owner_data = PlutusData::from(state.owner);

        let status = PlutusData::from(state.status);

        PlutusData::new_constr_plutus_data(ConstrPlutusData::new(0, vec![owner_data, status]))
    }
}

impl TryFrom<&[u8]> for State {
    type Error = String;

    fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
        let plutus_data = PlutusData::from_cbor_bytes(value)
            .map_err(|err| format!("can't decode as plutus data: {err}"))?;
        Self::try_from(plutus_data)
    }
}

impl TryFrom<PlutusData> for State {
    type Error = String;

    fn try_from(value: PlutusData) -> Result<Self, Self::Error> {
        let constr = match value {
            PlutusData::ConstrPlutusData(constr) => constr,
            _ => return Err("expected to see constr plutus data while parsing status".to_string()),
        };

        let owner = Owner::try_from(
            constr
                .fields
                .first()
                .cloned()
                .ok_or("no field found for owner while parsing state".to_string())?,
        )?;
        let status = Status::try_from(
            constr
                .fields
                .get(1)
                .cloned()
                .ok_or("no field found for status while parsing state".to_string())?,
        )?;

        Ok(State { owner, status })
    }
}

fn get_owner(constr: ConstrPlutusData) -> Result<Owner, String> {
    match constr.alternative {
        0 => match constr
            .fields
            .first()
            .ok_or("no field found for PKH bytes while parsing owner 0".to_string())?
        {
            PlutusData::Bytes { bytes, .. } => Ok(Owner::PKH(
                Ed25519KeyHash::from_raw_bytes(bytes).map_err(|err| {
                    format!(
                        "can't decode PKH bytes as Ed25519KeyHash while parsing owner 0: {err:?}"
                    )
                })?,
            )),
            _ => Err("expected to see PKH bytes field type while parsing owner 0".to_string()),
        },
        1 => {
            let policy_id = match constr.fields.first().ok_or("no field found for policy id bytes while parsing owner 1 (nft)".to_string())? {
                PlutusData::Bytes {
                         bytes, ..
                     } => PolicyId::from_raw_bytes(bytes).map_err(|err| format!("can't decode policy id bytes as PolicyId while parsing owner 1 (nft): {err:?}"))?,
                _ => {
                    return Err("expected to see policy id bytes field type while parsing owner 1 (nft)".to_string());
                }
            };
            let asset_name = match constr.fields.get(1).ok_or("no field found for asset name bytes while parsing owner 1 (nft)".to_string())? {
                PlutusData::Bytes {
                         bytes,
                         ..
                     } => AssetName::new(bytes.clone()).map_err(|err| format!("can't decode asset name bytes as AssetName while parsing owner 1 (nft): {err:?}"))?,
                _ => {
                    return Err("expected to see asset name bytes field type while parsing owner 1 (nft)".to_string());
                }
            };
            Ok(Owner::NFT(policy_id, asset_name))
        }
        2 => {
            let asset_name = match constr.fields.first().ok_or("no field found for asset name bytes while parsing owner 2 (receipt)".to_string())? {
                PlutusData::Bytes {
                         bytes,
                         ..
                     } => AssetName::new(bytes.clone()).map_err(|err| format!("can't decode asset name bytes as AssetName while parsing owner 2 (receipt): {err:?}"))?,
                _ => {
                    return Err("expected to see asset name bytes field type while parsing owner 2 (receipt)".to_string());
                }
            };
            Ok(Owner::Receipt(asset_name))
        }
        _ => Err(format!(
            "expected to see alternative in range 0-2 while parsing owner, got {}",
            constr.alternative
        )),
    }
}

fn get_status(constr: ConstrPlutusData) -> Result<Status, String> {
    match constr.alternative {
        0 => Ok(Status::Locked),
        1 => {
            let out_ref =
                OutRef::try_from(
                    constr.fields.first().cloned().ok_or(
                        "no field found for output reference while parsing unlocking status",
                    )?,
                )
                .map_err(|err| format!("{err} while parsing unlocking status"))?;
            let for_how_long = match constr.fields.get(1).ok_or(
                "no field found for for_how_long while parsing unlocking status".to_string(),
            )? {
                PlutusData::Integer(bigint) => bigint.clone(),
                _ => {
                    return Err("expected to see for_how_long bigint field type while parsing unlocking status".to_string());
                }
            };
            Ok(Status::Unlocking {
                out_ref,
                for_how_long,
            })
        }
        _ => Err(format!(
            "expected to see alternative in range 0-1 while parsing status, got {}",
            constr.alternative
        )),
    }
}

#[cfg(test)]
mod tests {
    use crate::state::{Owner, State, Status};
    use crate::OutRef;

    use cml_chain::assets::AssetName;

    use cml_chain::plutus::PlutusData;
    use cml_chain::PolicyId;

    use cml_chain::utils::BigInt;
    use cml_crypto::{Ed25519KeyHash, TransactionHash};

    #[test]
    fn test_datum_pkh() {
        let datum = State {
            owner: Owner::PKH(
                Ed25519KeyHash::from_hex(
                    "66e7ab739435e31d3c4c4197d6cc08c1ee5be7309e14242a07b03541",
                )
                .unwrap(),
            ),
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
            owner: Owner::NFT(
                PolicyId::from_hex("e8695b87ed398f16c02634f74b132b39e544e5993e09d722cfd31ea5")
                    .unwrap(),
                AssetName::new(hex::decode("4c6f636b2054657374204e465420436f6e74726f6c").unwrap())
                    .unwrap(),
            ),
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
            owner: Owner::Receipt(
                AssetName::new(hex::decode("4c6f636b2054657374204e465420436f6e74726f6c").unwrap())
                    .unwrap(),
            ),
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
            owner: Owner::Receipt(
                AssetName::new(hex::decode("4c6f636b2054657374204e465420436f6e74726f6c").unwrap())
                    .unwrap(),
            ),
            status: Status::Unlocking {
                out_ref: OutRef {
                    tx_id: TransactionHash::from_hex(
                        "54df9f06aed611f1183c2b4534762ad4ee04fffe7fa4bad35c7517c3cf397dd8",
                    )
                    .unwrap(),
                    index: 2,
                },
                for_how_long: BigInt::from(300),
            },
        };
        let plutus_datum = PlutusData::from(datum.clone());
        let convert_back = State::try_from(plutus_datum);
        assert!(convert_back.is_ok(), "{:?}", convert_back.err());
        assert_eq!(convert_back.unwrap(), datum);
    }
}
