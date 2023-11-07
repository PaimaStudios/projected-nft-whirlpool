import { Nft } from "alchemy-sdk";

export interface LockInfo {
  token: `0x${string}`;
  tokenId: bigint;
  unlockTime: bigint;
  nftData?: Nft;
}
