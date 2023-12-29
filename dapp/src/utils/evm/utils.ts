import { arbitrum, arbitrumSepolia, mainnet, sepolia } from "viem/chains";
import { TokenEVM } from "./types";
import env from "../configs/env";

export const areEqualTokens = (a: TokenEVM, b: TokenEVM) => {
  return a.token === b.token && a.tokenId === b.tokenId;
};

export const formatEVMAddress = (
  address: string | undefined,
): string | undefined => {
  if (address === undefined) return undefined;
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;
};

export const getAlchemyApiKey = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
    case sepolia.id:
      return env.REACT_APP_ALCHEMY_ETHEREUM_API_KEY;
    case arbitrum.id:
    case arbitrumSepolia.id:
      return env.REACT_APP_ALCHEMY_ARBITRUM_API_KEY;
    default:
      return null;
  }
};
