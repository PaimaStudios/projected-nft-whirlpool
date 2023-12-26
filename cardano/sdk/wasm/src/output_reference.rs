use wasm_bindgen::prelude::{wasm_bindgen, JsError, JsValue};

#[derive(Clone, Debug)]
#[wasm_bindgen]
pub struct OutRef(cardano_projected_nft::OutRef);

#[wasm_bindgen]
impl OutRef {
    pub fn to_json(&self) -> Result<String, JsError> {
        serde_json::to_string_pretty(&self.0).map_err(|e| JsError::new(&format!("to_json: {}", e)))
    }

    pub fn to_json_value(&self) -> Result<JsValue, JsError> {
        serde_wasm_bindgen::to_value(&self.0)
            .map_err(|e| JsError::new(&format!("to_js_value: {}", e)))
    }

    pub fn from_json(json: &str) -> Result<OutRef, JsError> {
        serde_json::from_str(json)
            .map(Self)
            .map_err(|e| JsError::new(&format!("from_json: {}", e)))
    }

    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        out_ref: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<OutRef, JsValue> {
        cardano_projected_nft::OutRef::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            out_ref.clone(),
        ))
        .map(OutRef)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }

    pub fn new(tx_id: &cml_crypto_wasm::TransactionHash, index: u64) -> Self {
        Self(cardano_projected_nft::OutRef::new(
            tx_id.clone().into(),
            index,
        ))
    }
}

impl From<cardano_projected_nft::OutRef> for OutRef {
    fn from(native: cardano_projected_nft::OutRef) -> Self {
        Self(native)
    }
}

impl From<OutRef> for cardano_projected_nft::OutRef {
    fn from(wasm: OutRef) -> Self {
        wasm.0
    }
}

impl AsRef<cardano_projected_nft::OutRef> for OutRef {
    fn as_ref(&self) -> &cardano_projected_nft::OutRef {
        &self.0
    }
}
