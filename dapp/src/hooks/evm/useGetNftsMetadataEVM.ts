import { Alchemy, NftMetadataBatchToken } from "alchemy-sdk";
import { useAlchemy } from "./useAlchemy";
import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";

const fetchNftsMetadata = async (
  alchemy: Alchemy | undefined,
  nfts: NftMetadataBatchToken[],
) => {
  if (alchemy === undefined || nfts.length === 0) {
    return null;
  }
  // Alchemy API call maximum https://docs.alchemy.com/reference/getnftmetadatabatch-v3
  const maxSize = 100;
  const nftsChunks: NftMetadataBatchToken[][] = [];
  for (let i = 0; i < Math.ceil(nfts.length / maxSize); i++) {
    nftsChunks.push(nfts.slice(i * maxSize, i * maxSize + maxSize));
  }
  const result = await Promise.all(
    nftsChunks.map(async (nftsChunk) => {
      return await alchemy?.nft.getNftMetadataBatch(nftsChunk);
    }),
  );
  return result.flat();
};

export const useGetNftsMetadataEVM = (nfts: NftMetadataBatchToken[]) => {
  const { data: alchemy } = useAlchemy();

  return useQuery({
    queryKey: [FunctionKey.NFTS_METADATA, { nfts, alchemy }],
    queryFn: () => fetchNftsMetadata(alchemy, nfts),
  });
};
