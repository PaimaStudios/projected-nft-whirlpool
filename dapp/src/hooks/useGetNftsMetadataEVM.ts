import { Alchemy, Nft, NftMetadataBatchToken } from "alchemy-sdk";
import { useEffect, useState } from "react";
import { useGetAlchemy } from "./useGetAlchemy";

export const useGetNftsMetadataEVM = (
  nfts: NftMetadataBatchToken[],
): Nft[] | undefined => {
  const [nftsMetadata, setNftsMetadata] = useState<Nft[]>();
  const alchemy = useGetAlchemy();

  useEffect(() => {
    const fetchNftsMetadata = async (alchemy: Alchemy) => {
      const response = await alchemy?.nft.getNftMetadataBatch(nfts);
      setNftsMetadata(response);
    };
    if (nfts.length > 0 && alchemy) {
      fetchNftsMetadata(alchemy);
    }
  }, [nfts.length, alchemy]);

  return nftsMetadata;
};
