import { Alchemy } from "alchemy-sdk";
import { useGetAlchemy } from "./useGetAlchemy";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";

const fetchNfts = async (
  address: string | undefined,
  alchemy: Alchemy | undefined,
) => {
  if (address === undefined || alchemy === undefined) {
    return null;
  }
  const ownedNfts = (await alchemy.nft.getNftsForOwner(address)).ownedNfts;
  return ownedNfts;
};

export const useGetNftsEVM = () => {
  const { data: alchemy } = useGetAlchemy();
  const { address } = useAccount();
  return useQuery({
    queryKey: [FunctionKey.NFTS, { address, alchemy }],
    queryFn: () => fetchNfts(address, alchemy),
  });
};
