import env from "../configs/env";
import {
  NetworkInfo
} from "@dcspark/cardano-multiplatform-lib-browser";

/**
 * Define supported chains
 */
export const supportedChains: number[] = env.REACT_APP_TESTNET
  ? [NetworkInfo.preprod().network_id()]
  : [NetworkInfo.mainnet().network_id()];


export const isChainSupported = (chainId: number | undefined) => {
  return (
    chainId != null && supportedChains.find((chain) => chain === chainId) != null
  );
};
  