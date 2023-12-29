"use client";
import { useQuery } from "@tanstack/react-query";
import { Alchemy } from "alchemy-sdk";
import { useNetwork } from "wagmi";
import FunctionKey from "../../utils/functionKey";
import { getAlchemyApiKey } from "../../utils/evm/utils";
import { WagmiToAlchemy } from "../../utils/evm/chains";

export const useAlchemy = () => {
  const { chain } = useNetwork();

  return useQuery({
    queryKey: [FunctionKey.ALCHEMY, { chain }],
    queryFn: () => {
      if (!chain) {
        return null;
      }
      const apiKey = getAlchemyApiKey(chain.id);
      if (!apiKey) {
        return null;
      }
      return new Alchemy({
        apiKey,
        network: WagmiToAlchemy[chain.id],
      });
    },
  });
};
