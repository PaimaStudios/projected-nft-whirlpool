fn main() {
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
    let schema_path = std::path::Path::new(&"schemas");
    if !schema_path.exists() {
        std::fs::create_dir(schema_path).unwrap();
    }
    gen_json_schema!(projected_nft_structs::AssetName);
    gen_json_schema!(projected_nft_structs::Keyhash);
    gen_json_schema!(projected_nft_structs::NFT);
    gen_json_schema!(projected_nft_structs::Owner);
    gen_json_schema!(projected_nft_structs::PolicyId);
    gen_json_schema!(projected_nft_structs::Status);
    gen_json_schema!(projected_nft_structs::StatusUnlocking);
    gen_json_schema!(projected_nft_structs::TransactionInput);
}
