import { Alchemy } from "alchemy-sdk";
import { useAlchemy } from "./useAlchemy";
import { useAccount } from "wagmi";
import { QueryFunctionContext, useInfiniteQuery } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";

const fetchNfts = async ({
  address,
  alchemy,
  queryParams,
}: {
  address: string | undefined;
  alchemy: Alchemy | undefined;
  queryParams: QueryFunctionContext<any, string>;
}) => {
  const { pageParam } = queryParams;
  if (address === undefined || alchemy === undefined) {
    return null;
  }
  return await alchemy.nft.getNftsForOwner(address, {
    pageKey: pageParam,
  });
};

export const useGetNftsEVM = () => {
  const { data: alchemy } = useAlchemy();
  const { address } = useAccount();
  return useInfiniteQuery({
    queryKey: [FunctionKey.NFTS, { address, alchemy }],
    queryFn: (queryParams) => fetchNfts({ address, alchemy, queryParams }),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.pageKey,
  });
};
