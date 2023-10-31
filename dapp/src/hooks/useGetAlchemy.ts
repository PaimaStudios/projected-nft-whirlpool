"use client";
import { Alchemy, Network } from "alchemy-sdk";
import { useEffect, useState } from "react";
import { useNetwork } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";

const WagmiToAlchemy: Record<number, Network> = {
  [sepolia.id]: Network.ETH_SEPOLIA,
  [mainnet.id]: Network.ETH_MAINNET,
};

export const useGetAlchemy = (): Alchemy | undefined => {
  const [alchemy, setAlchemy] = useState<Alchemy>();
  const { chain } = useNetwork();

  useEffect(() => {
    if (!chain) return;
    const settings = {
      apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
      network: WagmiToAlchemy[chain.id],
    };
    setAlchemy(new Alchemy(settings));
  }, [chain]);

  return alchemy;
};
