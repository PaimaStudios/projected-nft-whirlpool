import { Network } from "alchemy-sdk";
import env from "../configs/env";
import {
  Chain,
  arbitrum,
  arbitrumSepolia,
  mainnet,
  sepolia,
} from "viem/chains";

export const supportedChains: Chain[] = env.REACT_APP_TESTNET
  ? [sepolia, arbitrumSepolia]
  : [mainnet];

export const isChainSupported = (chainId: number | undefined) => {
  return (
    chainId != null && !!supportedChains.find((chain) => chain.id === chainId)
  );
};

export const WagmiToAlchemy: Record<number, Network> = {
  [sepolia.id]: Network.ETH_SEPOLIA,
  [mainnet.id]: Network.ETH_MAINNET,
  [arbitrum.id]: Network.ARB_MAINNET,
  [arbitrumSepolia.id]: Network.ARB_SEPOLIA,
};
