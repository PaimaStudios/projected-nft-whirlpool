// same as cbor_event::de::Deserialize but with our DeserializeError
pub trait Deserialize {
    fn from_cbor_bytes(data: &[u8]) -> Result<Self, DeserializeError>
    where
        Self: Sized,
    {
        let mut raw = Deserializer::from(std::io::Cursor::new(data));
        Self::deserialize(&mut raw)
    }

    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<Self, DeserializeError>
    where
        Self: Sized;
}

impl<T: cbor_event::de::Deserialize> Deserialize for T {
    fn deserialize<R: BufRead + Seek>(raw: &mut Deserializer<R>) -> Result<T, DeserializeError> {
        T::deserialize(raw).map_err(DeserializeError::from)
    }
}
pub struct CBORReadLen {
    deser_len: cbor_event::LenSz,
    read: u64,
}

impl CBORReadLen {
    pub fn new(len: cbor_event::LenSz) -> Self {
        Self {
            deser_len: len,
            read: 0,
        }
    }

    // Marks {n} values as being read, and if we go past the available definite length
    // given by the CBOR, we return an error.
    pub fn read_elems(&mut self, count: usize) -> Result<(), DeserializeFailure> {
        match self.deser_len {
            cbor_event::LenSz::Len(n, _) => {
                self.read += count as u64;
                if self.read > n {
                    Err(DeserializeFailure::DefiniteLenMismatch(n, None))
                } else {
                    Ok(())
                }
            }
            cbor_event::LenSz::Indefinite => Ok(()),
        }
    }

    pub fn finish(&self) -> Result<(), DeserializeFailure> {
        match self.deser_len {
            cbor_event::LenSz::Len(n, _) => {
                if self.read == n {
                    Ok(())
                } else {
                    Err(DeserializeFailure::DefiniteLenMismatch(n, Some(self.read)))
                }
            }
            cbor_event::LenSz::Indefinite => Ok(()),
        }
    }
}

pub trait DeserializeEmbeddedGroup {
    fn deserialize_as_embedded_group<R: BufRead + Seek>(
        raw: &mut Deserializer<R>,
        read_len: &mut CBORReadLen,
        len: cbor_event::LenSz,
    ) -> Result<Self, DeserializeError>
    where
        Self: Sized;
}

#[inline]
pub(crate) fn sz_max(sz: cbor_event::Sz) -> u64 {
    match sz {
        cbor_event::Sz::Inline => 23u64,
        cbor_event::Sz::One => u8::MAX as u64,
        cbor_event::Sz::Two => u16::MAX as u64,
        cbor_event::Sz::Four => u32::MAX as u64,
        cbor_event::Sz::Eight => u64::MAX,
    }
}

#[derive(Debug, PartialEq, Eq, Copy, Clone)]
pub enum LenEncoding {
    Canonical,
    Definite(cbor_event::Sz),
    Indefinite,
}

impl Default for LenEncoding {
    fn default() -> Self {
        Self::Canonical
    }
}

impl From<cbor_event::LenSz> for LenEncoding {
    fn from(len_sz: cbor_event::LenSz) -> Self {
        match len_sz {
            cbor_event::LenSz::Len(len, sz) => {
                if cbor_event::Sz::canonical(len) == sz {
                    Self::Canonical
                } else {
                    Self::Definite(sz)
                }
            }
            cbor_event::LenSz::Indefinite => Self::Indefinite,
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone)]
pub enum StringEncoding {
    Canonical,
    Indefinite(Vec<(u64, cbor_event::Sz)>),
    Definite(cbor_event::Sz),
}

impl Default for StringEncoding {
    fn default() -> Self {
        Self::Canonical
    }
}

impl From<cbor_event::StringLenSz> for StringEncoding {
    fn from(len_sz: cbor_event::StringLenSz) -> Self {
        match len_sz {
            cbor_event::StringLenSz::Len(sz) => Self::Definite(sz),
            cbor_event::StringLenSz::Indefinite(lens) => Self::Indefinite(lens),
        }
    }
}
#[inline]
pub(crate) fn fit_sz(len: u64, sz: Option<cbor_event::Sz>) -> cbor_event::Sz {
    match sz {
        Some(sz) => {
            if len <= sz_max(sz) {
                sz
            } else {
                cbor_event::Sz::canonical(len)
            }
        }
        None => cbor_event::Sz::canonical(len),
    }
}

impl LenEncoding {
    pub fn to_len_sz(&self, len: u64) -> cbor_event::LenSz {
        match self {
            Self::Canonical => cbor_event::LenSz::Len(len, cbor_event::Sz::canonical(len)),
            Self::Definite(sz) => {
                if sz_max(*sz) >= len {
                    cbor_event::LenSz::Len(len, *sz)
                } else {
                    cbor_event::LenSz::Len(len, cbor_event::Sz::canonical(len))
                }
            }
            Self::Indefinite => cbor_event::LenSz::Indefinite,
        }
    }

    pub fn end<'a, W: Write + Sized>(
        &self,
        serializer: &'a mut Serializer<W>,
    ) -> cbor_event::Result<&'a mut Serializer<W>> {
        if *self == Self::Indefinite {
            serializer.write_special(cbor_event::Special::Break)?;
        }
        Ok(serializer)
    }
}

impl StringEncoding {
    pub fn to_str_len_sz(&self, len: u64) -> cbor_event::StringLenSz {
        match self {
            Self::Canonical => cbor_event::StringLenSz::Len(cbor_event::Sz::canonical(len)),
            Self::Definite(sz) => {
                if sz_max(*sz) >= len {
                    cbor_event::StringLenSz::Len(*sz)
                } else {
                    cbor_event::StringLenSz::Len(cbor_event::Sz::canonical(len))
                }
            }
            Self::Indefinite(lens) => cbor_event::StringLenSz::Indefinite(lens.clone()),
        }
    }
}
pub trait SerializeEmbeddedGroup {
    fn serialize_as_embedded_group<'a, W: Write + Sized>(
        &self,
        serializer: &'a mut Serializer<W>,
    ) -> cbor_event::Result<&'a mut Serializer<W>>;
}

pub trait ToCBORBytes {
    fn to_cbor_bytes(&self) -> Vec<u8>;
}

impl<T: cbor_event::se::Serialize> ToCBORBytes for T {
    fn to_cbor_bytes(&self) -> Vec<u8> {
        let mut buf = Serializer::new_vec();
        self.serialize(&mut buf).unwrap();
        buf.finalize()
    }
}
pub trait RawBytesEncoding {
    fn to_raw_bytes(&self) -> Vec<u8>;

    fn from_raw_bytes(bytes: &[u8]) -> Result<Self, DeserializeError>
    where
        Self: Sized;

    fn to_raw_hex(&self) -> String {
        hex::encode(self.to_raw_bytes())
    }

    fn from_raw_hex(hex_str: &str) -> Result<Self, DeserializeError>
    where
        Self: Sized,
    {
        let bytes =
            hex::decode(hex_str).map_err(|e| DeserializeFailure::InvalidStructure(Box::new(e)))?;
        Self::from_raw_bytes(bytes.as_ref())
    }
}

// This file was code-generated using an experimental CDDL to rust tool:
// https://github.com/dcSpark/cddl-codegen

use super::cbor_encodings::*;
use super::*;
use crate::error::*;
use cbor_event::de::Deserializer;
use cbor_event::se::{Serialize, Serializer};
use std::io::{BufRead, Seek, SeekFrom, Write};

impl cbor_event::se::Serialize for NFT {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_array_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2),
        )?;
        serializer.write_bytes_sz(
            &self.policy_id.to_raw_bytes(),
            self.encodings
                .as_ref()
                .map(|encs| encs.policy_id_encoding.clone())
                .unwrap_or_default()
                .to_str_len_sz(self.policy_id.to_raw_bytes().len() as u64),
        )?;
        serializer.write_bytes_sz(
            &self.asset_name.to_raw_bytes(),
            self.encodings
                .as_ref()
                .map(|encs| encs.asset_name_encoding.clone())
                .unwrap_or_default()
                .to_str_len_sz(self.asset_name.to_raw_bytes().len() as u64),
        )?;
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer)
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
            let (asset_name, asset_name_encoding) = raw
                .bytes_sz()
                .map_err(Into::<DeserializeError>::into)
                .and_then(|(bytes, enc)| {
                    AssetName::from_raw_bytes(&bytes)
                        .map(|bytes| (bytes, StringEncoding::from(enc)))
                        .map_err(|e| DeserializeFailure::InvalidStructure(Box::new(e)).into())
                })
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
                    asset_name_encoding,
                }),
            })
        })()
        .map_err(|e| e.annotate("NFT"))
    }
}

impl cbor_event::se::Serialize for Owner {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        match self {
            Owner::PKH {
                p_k_h,
                p_k_h_encoding,
            } => serializer.write_bytes_sz(
                &p_k_h.to_raw_bytes(),
                p_k_h_encoding.to_str_len_sz(p_k_h.to_raw_bytes().len() as u64),
            ),
            Owner::NFT(n_f_t) => n_f_t.serialize(serializer),
            Owner::Receipt {
                receipt,
                receipt_encoding,
            } => serializer.write_bytes_sz(
                &receipt.to_raw_bytes(),
                receipt_encoding.to_str_len_sz(receipt.to_raw_bytes().len() as u64),
            ),
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
            let deser_variant: Result<_, DeserializeError> = raw
                .bytes_sz()
                .map_err(Into::<DeserializeError>::into)
                .and_then(|(bytes, enc)| {
                    AssetName::from_raw_bytes(&bytes)
                        .map(|bytes| (bytes, StringEncoding::from(enc)))
                        .map_err(|e| DeserializeFailure::InvalidStructure(Box::new(e)).into())
                });
            match deser_variant {
                Ok((receipt, receipt_encoding)) => {
                    return Ok(Self::Receipt {
                        receipt,
                        receipt_encoding,
                    })
                }
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

impl cbor_event::se::Serialize for State {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_array_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2),
        )?;
        self.owner.serialize(serializer)?;
        self.status.serialize(serializer)?;
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer)
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

impl cbor_event::se::Serialize for Status {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        match self {
            Status::Locked { locked_encoding } => {
                serializer.write_unsigned_integer_sz(0u64, fit_sz(0u64, *locked_encoding))
            }
            Status::Unlocking(unlocking) => unlocking.serialize(serializer),
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

impl cbor_event::se::Serialize for StatusUnlocking {
    fn serialize<'se, W: Write>(
        &self,
        serializer: &'se mut Serializer<W>,
    ) -> cbor_event::Result<&'se mut Serializer<W>> {
        serializer.write_map_sz(
            self.encodings
                .as_ref()
                .map(|encs| encs.len_encoding)
                .unwrap_or_default()
                .to_len_sz(2),
        )?;
        let deser_order = self
            .encodings
            .as_ref()
            .filter(|encs| encs.orig_deser_order.len() == 2)
            .map(|encs| encs.orig_deser_order.clone())
            .unwrap_or_else(|| (0..2).collect());
        for field_index in deser_order {
            match field_index {
                0 => {
                    serializer.write_text_sz(
                        &"out_ref",
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.out_ref_key_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz("out_ref".len() as u64),
                    )?;
                    serializer.write_bytes_sz(
                        &self.out_ref.to_raw_bytes(),
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.out_ref_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz(self.out_ref.to_raw_bytes().len() as u64),
                    )?;
                }
                1 => {
                    serializer.write_text_sz(
                        &"for_how_long",
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.for_how_long_key_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz("for_how_long".len() as u64),
                    )?;
                    serializer.write_bytes_sz(
                        &self.for_how_long.to_raw_bytes(),
                        self.encodings
                            .as_ref()
                            .map(|encs| encs.for_how_long_encoding.clone())
                            .unwrap_or_default()
                            .to_str_len_sz(self.for_how_long.to_raw_bytes().len() as u64),
                    )?;
                }
                _ => unreachable!(),
            };
        }
        self.encodings
            .as_ref()
            .map(|encs| encs.len_encoding)
            .unwrap_or_default()
            .end(serializer)
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
            let mut out_ref_encoding = StringEncoding::default();
            let mut out_ref_key_encoding = StringEncoding::default();
            let mut out_ref = None;
            let mut for_how_long_encoding = StringEncoding::default();
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
                                let (tmp_out_ref, tmp_out_ref_encoding) = raw
                                    .bytes_sz()
                                    .map_err(Into::<DeserializeError>::into)
                                    .and_then(|(bytes, enc)| {
                                        TransactionInput::from_raw_bytes(&bytes)
                                            .map(|bytes| (bytes, StringEncoding::from(enc)))
                                            .map_err(|e| {
                                                DeserializeFailure::InvalidStructure(Box::new(e))
                                                    .into()
                                            })
                                    })
                                    .map_err(|e: DeserializeError| e.annotate("out_ref"))?;
                                out_ref = Some(tmp_out_ref);
                                out_ref_encoding = tmp_out_ref_encoding;
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
                                let (tmp_for_how_long, tmp_for_how_long_encoding) = raw
                                    .bytes_sz()
                                    .map_err(Into::<DeserializeError>::into)
                                    .and_then(|(bytes, enc)| {
                                        Int64::from_raw_bytes(&bytes)
                                            .map(|bytes| (bytes, StringEncoding::from(enc)))
                                            .map_err(|e| {
                                                DeserializeFailure::InvalidStructure(Box::new(e))
                                                    .into()
                                            })
                                    })
                                    .map_err(|e: DeserializeError| e.annotate("for_how_long"))?;
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
                    out_ref_encoding,
                    for_how_long_key_encoding,
                    for_how_long_encoding,
                }),
            })
        })()
        .map_err(|e| e.annotate("StatusUnlocking"))
    }
}
