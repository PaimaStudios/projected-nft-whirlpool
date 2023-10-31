"use client";
import { useAccount } from "wagmi";

export type ChainType = "EVM" | "Cardano";

export const useGetChainType = (): ChainType | null => {
  const { isConnected: isConnectedEVM } = useAccount();
  const isConnectedCardano = false;

  return isConnectedEVM ? "EVM" : isConnectedCardano ? "Cardano" : null;
};
