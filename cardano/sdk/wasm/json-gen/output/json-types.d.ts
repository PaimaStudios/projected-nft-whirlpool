export type MintRedeemerJSON =
  | "BurnTokens"
  | {
      MintTokens: {
        total: string;
        [k: string]: unknown;
      };
    };
export interface OutRefJSON {
  index: number;
  tx_id: string;
}
export type OwnerJSON =
  | {
      PKH: string;
    }
  | {
      NFT: [string, AssetNameJSON];
    }
  | {
      Receipt: AssetNameJSON;
    };
export interface RedeemJSON {
  new_receipt_owner?: AssetNameJSON | null;
  nft_input_owner?: OutRefJSON | null;
  partial_withdraw: boolean;
}
export interface StateJSON {
  owner: OwnerJSON;
  status: StatusJSON;
}
export type StatusJSON =
  | "Locked"
  | {
      Unlocking: {
        for_how_long: string;
        out_ref: OutRefJSON;
        [k: string]: unknown;
      };
    };
export type ScriptHashJSON = string;
export interface AssetNameJSON {
  inner: number[];
}
export type BigIntJSON = string;
export type Ed25519KeyHashJSON = string;
