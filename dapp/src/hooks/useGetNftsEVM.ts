import { Alchemy, Nft } from "alchemy-sdk";
import { useEffect, useState } from "react";
import { useGetAlchemy } from "./useGetAlchemy";
import { useAccount } from "wagmi";

export const useGetNftsEVM = (): Nft[] | undefined => {
  const [nfts, setNfts] = useState<Nft[]>();
  const alchemy = useGetAlchemy();
  const { address } = useAccount();

  useEffect(() => {
    const fetchNfts = async (address: string, alchemy: Alchemy) => {
      setNfts((await alchemy.nft.getNftsForOwner(address)).ownedNfts);
    };
    if (address && alchemy) {
      fetchNfts(address, alchemy);
    }
  }, [address, alchemy]);

  return nfts;
};
