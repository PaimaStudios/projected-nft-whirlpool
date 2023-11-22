"use client";
import { useAccount } from "wagmi";
import { useDappStore } from "../store";

export type ChainType = "EVM" | "Cardano";

export const useGetChainType = (): ChainType | null => {
  const selectedWalletKey = useDappStore((state) => state.selectedWallet);
  const { isConnected: isConnectedEVM } = useAccount();
  const isConnectedCardano = !!selectedWalletKey;

  return isConnectedEVM ? "EVM" : isConnectedCardano ? "Cardano" : null;
};
