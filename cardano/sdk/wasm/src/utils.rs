use crate::*;

#[wasm_bindgen]
impl MintRedeemer {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        redeemer: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<MintRedeemer, JsValue> {
        cardano_projected_nft_sdk::MintRedeemer::try_from(
            Into::<cml_chain::plutus::PlutusData>::into(redeemer.clone()),
        )
        .map(MintRedeemer)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }
}

#[wasm_bindgen]
impl Owner {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(owner: &cml_chain_wasm::plutus::PlutusData) -> Result<Owner, JsValue> {
        cardano_projected_nft_sdk::Owner::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            owner.clone(),
        ))
        .map(Owner)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }
}

impl Redeem {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        redeemer: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<Redeem, JsValue> {
        cardano_projected_nft_sdk::Redeem::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            redeemer.clone(),
        ))
        .map(Redeem)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }
}

#[wasm_bindgen]
impl State {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(state: &cml_chain_wasm::plutus::PlutusData) -> Result<State, JsValue> {
        cardano_projected_nft_sdk::State::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            state.clone(),
        ))
        .map(State)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }
}

#[wasm_bindgen]
impl Status {
    pub fn to_plutus_data(&self) -> cml_chain_wasm::plutus::PlutusData {
        cml_chain::plutus::PlutusData::from(self.0.clone()).into()
    }

    pub fn from_plutus_data(
        status: &cml_chain_wasm::plutus::PlutusData,
    ) -> Result<Status, JsValue> {
        cardano_projected_nft_sdk::Status::try_from(Into::<cml_chain::plutus::PlutusData>::into(
            status.clone(),
        ))
        .map(Status)
        .map_err(|e| JsValue::from_str(&format!("from_plutus_data: {}", e)))
    }
}
