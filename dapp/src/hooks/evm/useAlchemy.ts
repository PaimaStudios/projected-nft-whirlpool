"use client";
import { useQuery } from "@tanstack/react-query";
import { Alchemy, Network } from "alchemy-sdk";
import { useNetwork } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import FunctionKey from "../../utils/functionKey";
import env from "../../utils/configs/env";

const WagmiToAlchemy: Record<number, Network> = {
  [sepolia.id]: Network.ETH_SEPOLIA,
  [mainnet.id]: Network.ETH_MAINNET,
};

export const useAlchemy = () => {
  const { chain } = useNetwork();

  return useQuery({
    queryKey: [FunctionKey.ALCHEMY, { chain }],
    queryFn: () => {
      if (!chain) {
        return undefined;
      }
      return new Alchemy({
        apiKey: env.REACT_APP_ALCHEMY_API_KEY,
        network: WagmiToAlchemy[chain.id],
      });
    },
  });
};
