import { Alchemy, NftMetadataBatchToken } from "alchemy-sdk";
import { useGetAlchemy } from "./useGetAlchemy";
import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";

const fetchNftsMetadata = async (
  alchemy: Alchemy | undefined,
  nfts: NftMetadataBatchToken[],
) => {
  if (alchemy === undefined || nfts.length === 0) {
    return null;
  }
  return await alchemy?.nft.getNftMetadataBatch(nfts);
};

export const useGetNftsMetadataEVM = (nfts: NftMetadataBatchToken[]) => {
  const { data: alchemy } = useGetAlchemy();

  return useQuery({
    queryKey: [FunctionKey.NFTS_METADATA, { nfts, alchemy }],
    queryFn: () => fetchNftsMetadata(alchemy, nfts),
  });
};
