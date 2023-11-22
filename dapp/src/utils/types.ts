import { Nft } from "alchemy-sdk";

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
