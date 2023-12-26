macro_rules! gen_json_schema {
    ($name:ty) => {
        let dest_path =
            std::path::Path::new(&"schemas").join(&format!("{}.json", stringify!($name)));
        std::fs::write(
            &dest_path,
            serde_json::to_string_pretty(&schemars::schema_for!($name)).unwrap(),
        )
        .unwrap();
    };
}

pub fn export_schemas() {
    let schema_path = std::path::Path::new(&"schemas");
    if !schema_path.exists() {
        std::fs::create_dir(schema_path).unwrap();
    }
    gen_json_schema!(cardano_projected_nft::MintRedeemer);
    gen_json_schema!(cardano_projected_nft::OutRef);
    gen_json_schema!(cardano_projected_nft::Owner);
    gen_json_schema!(cardano_projected_nft::Redeem);
    gen_json_schema!(cardano_projected_nft::State);
    gen_json_schema!(cardano_projected_nft::Status);

    // TODO: update once this is merged https://github.com/dcSpark/cardano-multiplatform-lib/pull/287
    gen_json_schema!(cml_chain::assets::AssetName);
    gen_json_schema!(cml_chain::utils::BigInt);
    gen_json_schema!(cml_crypto::Ed25519KeyHash);
    gen_json_schema!(cml_chain::PolicyId);
}
