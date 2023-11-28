import { Nft } from "alchemy-sdk";
import { Token } from "./cardano/token";

export interface LockInfo {
  token: `0x${string}`;
  tokenId: bigint;
  unlockTime: bigint;
  nftData?: Nft;
}

export type CardanoWallets = "eternl" | "flint" | "nami" | "typhoncip30";

export type CardanoWalletInfo = {
  name: string;
  icon: string;
  key: CardanoWallets;
  url: string;
};

type ProjectedNftCardanoEventsResponseObject = {
  txId: string;
  outputIndex: number;
  slot: number;
  asset: string;
  amount: string;
  status: "Lock" | "Unlocking" | "Claim" | "Invalid";
  plutusDatum: string;
};

export type ProjectedNftCardanoEventsResponse =
  ProjectedNftCardanoEventsResponseObject[];

export type LockInfoCardano = ProjectedNftCardanoEventsResponseObject & {
  token: Token;
  status: "Lock" | "Unlocking" | "Claim";
  owner: string;
  outRef: null | {
    hash: string;
    index: bigint;
  };
  unlockTime: null | bigint;
};

export type MetadataNftCardano = {
  [policyId: string]: {
    [assetName: string]: string;
  };
};

export type MetadataNftCardanoResponse = {
  cip25: MetadataNftCardano;
};
