import { Network } from "alchemy-sdk";
import env from "../configs/env";
import {
  Chain,
  arbitrum,
  arbitrumSepolia,
  mainnet,
  sepolia,
} from "viem/chains";

/**
 * Define supported chains
 */
export const supportedChains: Chain[] = env.REACT_APP_TESTNET
  ? [sepolia, arbitrumSepolia]
  : [mainnet];

/**
 * Mapping of numerical chain ids to Alchemy Network object
 */
export const WagmiToAlchemy: Record<number, Network> = {
  [sepolia.id]: Network.ETH_SEPOLIA,
  [mainnet.id]: Network.ETH_MAINNET,
  [arbitrum.id]: Network.ARB_MAINNET,
  [arbitrumSepolia.id]: Network.ARB_SEPOLIA,
};

/**
 * Define reserve waiting time that is added to the actual unlock time,
 * in order to not offer withdraw operation before there is a block surpassing the unlock time
 */
export const getChainReserveWaitingTime = (
  chainId: number | undefined,
): bigint => {
  switch (chainId) {
    case sepolia.id:
    case mainnet.id:
    case arbitrum.id:
    case arbitrumSepolia.id:
      // 1.5x blocktime (12s)
      return (12n * 3n) / 2n;
    default:
      return 0n;
  }
};

export const isChainSupported = (chainId: number | undefined) => {
  return (
    chainId != null && !!supportedChains.find((chain) => chain.id === chainId)
  );
};
