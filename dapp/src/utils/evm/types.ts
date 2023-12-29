import { Nft } from "alchemy-sdk";

export type TokenEVM = {
  token: `0x${string}`;
  tokenId: bigint;
};

export type LockInfoEVM = TokenEVM & {
  unlockTime: bigint;
  nftData?: Nft;
};
