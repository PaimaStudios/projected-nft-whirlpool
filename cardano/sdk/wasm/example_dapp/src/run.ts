import * as projected_nft from "cardano-projected-nft";

let state = projected_nft.State.new(
    projected_nft.Owner.new_nft(
        projected_nft.NFT.new(
            projected_nft.ScriptHash.from_hex("e8695b87ed398f16c02634f74b132b39e544e5993e09d722cfd31ea5"),
            projected_nft.AssetName.from_cbor_bytes(
                Buffer.from("4c6f636b2054657374204e465420436f6e74726f6c", "hex")
            )
        )
    ),
    projected_nft.Status.new_unlocking(
        projected_nft.UnlockingStatus.new(
            projected_nft.OutRef.new(
                projected_nft.TransactionHash.from_hex("da42e870c7da234bb7cba0462ce53a0c4bdd43fe943c5cf910907eaffaa221fa"),
                BigInt(10)
            ),
            BigInt(300)
        )
    )
);

let plutus_data_state = state.to_plutus_data();
let decoded_state = projected_nft.State.from_plutus_data(plutus_data_state);
console.log(plutus_data_state.to_json());
console.log(decoded_state.to_json(), state.to_json());
console.assert(decoded_state.to_json() === state.to_json());
