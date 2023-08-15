// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use super::cbor_encodings::*;
use super::*;
use cbor_event::de::Deserializer;
use cbor_event::se::Serializer;
use cml_core::error::*;
use cml_core::serialization::{fit_sz, CBORReadLen, Deserialize, Serialize};
use cml_crypto::RawBytesEncoding;
use std::io::{BufRead, Seek, SeekFrom, Write};

impl Serialize for NFT {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
        force_canonical: bool,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_array_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2, force_canonical),
        )?;
        serializer.write_bytes_sz(
            &self.policy_id.to_raw_bytes(),
            self.encodings
                .as_ref()
                .map(|encs| encs.policy_id_encoding.clone())
                .unwrap_or_default()
                .to_str_len_sz(self.policy_id.to_raw_bytes().len() as u64, force_canonical),
        )?;
        self.asset_name.serialize(serializer, force_canonical)?;
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer, force_canonical)
    }
}

impl Deserialize for NFT {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError> {
        let len = raw.array_sz()?;
        let len_encoding: LenEncoding = len.into();
        let mut read_len = CBORReadLen::new(len);
        read_len.read_elems(2)?;
        read_len.finish()?;
        (|| -> Result<_, DeserializeError> {
            let (policy_id, policy_id_encoding) = raw
                .bytes_sz()
                .map_err(Into::<DeserializeError>::into)
                .and_then(|(bytes, enc)| {
                    PolicyId::from_raw_bytes(&bytes)
                        .map(|bytes| (bytes, StringEncoding::from(enc)))
                        .map_err(|e| DeserializeFailure::InvalidStructure(Box::new(e)).into())
                })
                .map_err(|e: DeserializeError| e.annotate("policy_id"))?;
            let asset_name = AssetName::deserialize(raw)
                .map_err(|e: DeserializeError| e.annotate("asset_name"))?;
            match len {
                cbor_event::LenSz::Len(_, _) => (),
                cbor_event::LenSz::Indefinite => match raw.special()? {
                    cbor_event::Special::Break => (),
                    _ => return Err(DeserializeFailure::EndingBreakMissing.into()),
                },
            }
            Ok(NFT {
                policy_id,
                asset_name,
                encodings: Some(NFTEncoding {
                    len_encoding,
                    policy_id_encoding,
                }),
            })
        })()
        .map_err(|e| e.annotate("NFT"))
    }
}

impl Serialize for Owner {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
        force_canonical: bool,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        match self {
            Owner::PKH {
                p_k_h,
                p_k_h_encoding,
            } => serializer.write_bytes_sz(
                &p_k_h.to_raw_bytes(),
                p_k_h_encoding.to_str_len_sz(p_k_h.to_raw_bytes().len() as u64, force_canonical),
            ),
            Owner::NFT(n_f_t) => n_f_t.serialize(serializer, force_canonical),
            Owner::Receipt(receipt) => receipt.serialize(serializer, force_canonical),
        }
    }
}

impl Deserialize for Owner {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError> {
        (|| -> Result<_, DeserializeError> {
            let initial_position = raw.as_mut_ref().seek(SeekFrom::Current(0)).unwrap();
            let mut errs = Vec::new();
            let deser_variant: Result<_, DeserializeError> = raw
                .bytes_sz()
                .map_err(Into::<DeserializeError>::into)
                .and_then(|(bytes, enc)| {
                    Keyhash::from_raw_bytes(&bytes)
                        .map(|bytes| (bytes, StringEncoding::from(enc)))
                        .map_err(|e| DeserializeFailure::InvalidStructure(Box::new(e)).into())
                });
            match deser_variant {
                Ok((p_k_h, p_k_h_encoding)) => {
                    return Ok(Self::PKH {
                        p_k_h,
                        p_k_h_encoding,
                    })
                }
                Err(e) => {
                    errs.push(e.annotate("PKH"));
                    raw.as_mut_ref()
                        .seek(SeekFrom::Start(initial_position))
                        .unwrap();
                }
            };
            let deser_variant: Result<_, DeserializeError> = NFT::deserialize(raw);
            match deser_variant {
                Ok(n_f_t) => return Ok(Self::NFT(n_f_t)),
                Err(e) => {
                    errs.push(e.annotate("NFT"));
                    raw.as_mut_ref()
                        .seek(SeekFrom::Start(initial_position))
                        .unwrap();
                }
            };
            let deser_variant: Result<_, DeserializeError> = AssetName::deserialize(raw);
            match deser_variant {
                Ok(receipt) => return Ok(Self::Receipt(receipt)),
                Err(e) => {
                    errs.push(e.annotate("Receipt"));
                    raw.as_mut_ref()
                        .seek(SeekFrom::Start(initial_position))
                        .unwrap();
                }
            };
            Err(DeserializeError::new(
                "Owner",
                DeserializeFailure::NoVariantMatchedWithCauses(errs),
            ))
        })()
        .map_err(|e| e.annotate("Owner"))
    }
}

impl Serialize for State {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
        force_canonical: bool,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_array_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2, force_canonical),
        )?;
        self.owner.serialize(serializer, force_canonical)?;
        self.status.serialize(serializer, force_canonical)?;
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer, force_canonical)
    }
}

impl Deserialize for State {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError> {
        let len = raw.array_sz()?;
        let len_encoding: LenEncoding = len.into();
        let mut read_len = CBORReadLen::new(len);
        read_len.read_elems(2)?;
        read_len.finish()?;
        (|| -> Result<_, DeserializeError> {
            let owner =
                Owner::deserialize(raw).map_err(|e: DeserializeError| e.annotate("owner"))?;
            let status =
                Status::deserialize(raw).map_err(|e: DeserializeError| e.annotate("status"))?;
            match len {
                cbor_event::LenSz::Len(_, _) => (),
                cbor_event::LenSz::Indefinite => match raw.special()? {
                    cbor_event::Special::Break => (),
                    _ => return Err(DeserializeFailure::EndingBreakMissing.into()),
                },
            }
            Ok(State {
                owner,
                status,
                encodings: Some(StateEncoding { len_encoding }),
            })
        })()
        .map_err(|e| e.annotate("State"))
    }
}

impl Serialize for Status {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
        force_canonical: bool,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        match self {
            Status::Locked { locked_encoding } => serializer
                .write_unsigned_integer_sz(0u64, fit_sz(0u64, *locked_encoding, force_canonical)),
            Status::Unlocking(unlocking) => unlocking.serialize(serializer, force_canonical),
        }
    }
}

impl Deserialize for Status {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError> {
        (|| -> Result<_, DeserializeError> {
            match raw.cbor_type()? {
                cbor_event::Type::UnsignedInteger => {
                    let (locked_value, locked_encoding) = raw.unsigned_integer_sz()?;
                    if locked_value != 0 {
                        return Err(DeserializeFailure::FixedValueMismatch {
                            found: Key::Uint(locked_value),
                            expected: Key::Uint(0),
                        }
                        .into());
                    }
                    let locked_encoding = Some(locked_encoding);
                    Ok(Self::Locked { locked_encoding })
                }
                cbor_event::Type::Map => Ok(Status::Unlocking(StatusUnlocking::deserialize(raw)?)),
                _ => Err(DeserializeError::new(
                    "Status",
                    DeserializeFailure::NoVariantMatched,
                )),
            }
        })()
        .map_err(|e| e.annotate("Status"))
    }
}

impl Serialize for StatusUnlocking {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
        force_canonical: bool,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_map_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2, force_canonical),
        )?;
        let deser_order = self
            .encodings
            .as_ref()
            .filter(|encs| !force_canonical && encs.orig_deser_order.len() == 2)
            .map(|encs| encs.orig_deser_order.clone())
            .unwrap_or_else(|| vec![0, 1]);
        for field_index in deser_order {
            match field_index {
                0 => {
                    serializer.write_text_sz(
                        &"out_ref",
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.out_ref_key_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz("out_ref".len() as u64, force_canonical),
                    )?;
                    self.out_ref.serialize(serializer, force_canonical)?;
                }
                1 => {
                    serializer.write_text_sz(
                        &"for_how_long",
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.for_how_long_key_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz("for_how_long".len() as u64, force_canonical),
                    )?;
                    if self.for_how_long >= 0 {
                        serializer.write_unsigned_integer_sz(
                            self.for_how_long as u64,
                            fit_sz(
                                self.for_how_long as u64,
                                self.encodings
                                    .as_ref()
                                    .map(|encs| encs.for_how_long_encoding)
                                    .unwrap_or_default(),
                                force_canonical,
                            ),
                        )?;
                    } else {
                        serializer.write_negative_integer_sz(
                            self.for_how_long as i128,
                            fit_sz(
                                (self.for_how_long + 1).abs() as u64,
                                self.encodings
                                    .as_ref()
                                    .map(|encs| encs.for_how_long_encoding)
                                    .unwrap_or_default(),
                                force_canonical,
                            ),
                        )?;
                    }
                }
                _ => unreachable!(),
            };
        }
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer, force_canonical)
    }
}

impl Deserialize for StatusUnlocking {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError> {
        let len = raw.map_sz()?;
        let len_encoding: LenEncoding = len.into();
        let mut read_len = CBORReadLen::new(len);
        read_len.read_elems(2)?;
        read_len.finish()?;
        (|| -> Result<_, DeserializeError> {
            let mut orig_deser_order = Vec::new();
            let mut out_ref_key_encoding = StringEncoding::default();
            let mut out_ref = None;
            let mut for_how_long_encoding = None;
            let mut for_how_long_key_encoding = StringEncoding::default();
            let mut for_how_long = None;
            let mut read = 0;
            while match len {
                cbor_event::LenSz::Len(n, _) => read < n,
                cbor_event::LenSz::Indefinite => true,
            } {
                match raw.cbor_type()? {
                    cbor_event::Type::UnsignedInteger => {
                        return Err(DeserializeFailure::UnknownKey(Key::Uint(
                            raw.unsigned_integer()?,
                        ))
                        .into())
                    }
                    cbor_event::Type::Text => {
                        let (text_key, key_enc) = raw.text_sz()?;
                        match text_key.as_str() {
                            "out_ref" => {
                                if out_ref.is_some() {
                                    return Err(DeserializeFailure::DuplicateKey(Key::Str(
                                        "out_ref".into(),
                                    ))
                                    .into());
                                }
                                let tmp_out_ref = TransactionInput::deserialize(raw)
                                    .map_err(|e: DeserializeError| e.annotate("out_ref"))?;
                                out_ref = Some(tmp_out_ref);
                                out_ref_key_encoding = StringEncoding::from(key_enc);
                                orig_deser_order.push(0);
                            }
                            "for_how_long" => {
                                if for_how_long.is_some() {
                                    return Err(DeserializeFailure::DuplicateKey(Key::Str(
                                        "for_how_long".into(),
                                    ))
                                    .into());
                                }
                                let (tmp_for_how_long, tmp_for_how_long_encoding) =
                                    (|| -> Result<_, DeserializeError> {
                                        Ok(match raw.cbor_type()? {
                                            cbor_event::Type::UnsignedInteger => {
                                                let (x, enc) = raw.unsigned_integer_sz()?;
                                                (x as i64, Some(enc))
                                            }
                                            _ => {
                                                let (x, enc) = raw.negative_integer_sz()?;
                                                (x as i64, Some(enc))
                                            }
                                        })
                                    })()
                                    .map_err(|e| e.annotate("for_how_long"))?;
                                for_how_long = Some(tmp_for_how_long);
                                for_how_long_encoding = tmp_for_how_long_encoding;
                                for_how_long_key_encoding = StringEncoding::from(key_enc);
                                orig_deser_order.push(1);
                            }
                            unknown_key => {
                                return Err(DeserializeFailure::UnknownKey(Key::Str(
                                    unknown_key.to_owned(),
                                ))
                                .into())
                            }
                        }
                    }
                    cbor_event::Type::Special => match len {
                        cbor_event::LenSz::Len(_, _) => {
                            return Err(DeserializeFailure::BreakInDefiniteLen.into())
                        }
                        cbor_event::LenSz::Indefinite => match raw.special()? {
                            cbor_event::Special::Break => break,
                            _ => return Err(DeserializeFailure::EndingBreakMissing.into()),
                        },
                    },
                    other_type => {
                        return Err(DeserializeFailure::UnexpectedKeyType(other_type).into())
                    }
                }
                read += 1;
            }
            let out_ref =
                match out_ref {
                    Some(x) => x,
                    None => {
                        return Err(DeserializeFailure::MandatoryFieldMissing(Key::Str(
                            String::from("out_ref"),
                        ))
                        .into())
                    }
                };
            let for_how_long =
                match for_how_long {
                    Some(x) => x,
                    None => {
                        return Err(DeserializeFailure::MandatoryFieldMissing(Key::Str(
                            String::from("for_how_long"),
                        ))
                        .into())
                    }
                };
            ();
            Ok(Self {
                out_ref,
                for_how_long,
                encodings: Some(StatusUnlockingEncoding {
                    len_encoding,
                    orig_deser_order,
                    out_ref_key_encoding,
                    for_how_long_key_encoding,
                    for_how_long_encoding,
                }),
            })
        })()
        .map_err(|e| e.annotate("StatusUnlocking"))
    }
}
