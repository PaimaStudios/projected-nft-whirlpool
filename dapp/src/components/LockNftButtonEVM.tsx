"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import { usePrepareErc721SafeTransferFrom } from "../generated";
import TransactionButton from "./TransactionButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";

type Props = {
  token: string;
  tokenId: bigint;
};

export default function LockNftButtonEVM({ token, tokenId }: Props) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { config } = usePrepareErc721SafeTransferFrom({
    address: token as `0x${string}`,
    args: [address!, hololockerConfig.address, tokenId],
    enabled: !!address,
  });

  const { write, data, isLoading } = useContractWrite(config);

  const { isLoading: isPending } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

  async function lockNft() {
    write?.();
  }

  return (
    <TransactionButton
      onClick={lockNft}
      isLoading={isLoading}
      isPending={isPending}
      actionText={"Lock NFT"}
    />
  );
}
