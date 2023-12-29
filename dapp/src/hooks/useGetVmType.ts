"use client";
import { useAccount } from "wagmi";
import { useDappStore } from "../store";
import { VmTypes } from "../utils/constants";

export const useGetVmType = () => {
  const selectedWalletKey = useDappStore((state) => state.selectedWallet);
  const { isConnected: isConnectedEVM } = useAccount();
  const isConnectedCardano = !!selectedWalletKey;

  return isConnectedEVM
    ? VmTypes.EVM
    : isConnectedCardano
    ? VmTypes.Cardano
    : VmTypes.None;
};
