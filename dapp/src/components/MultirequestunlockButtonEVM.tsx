"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import { usePrepareHololockerRequestUnlock } from "../generated";
import TransactionButton from "./TransactionButton";
import FunctionKey from "../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function MultirequestunlockButtonEVM({
  token,
  tokenIds,
}: Props) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { config: configHololockerUnlock } = usePrepareHololockerRequestUnlock({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds],
    enabled: !!address,
  });

  const {
    write: writeHololockerUnlock,
    data: dataHololockerUnlock,
    isLoading: isLoadingHololockerUnlock,
  } = useContractWrite(configHololockerUnlock);

  const { isLoading: isPendingHololockerUnlock } = useWaitForTransaction({
    hash: dataHololockerUnlock?.hash,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

  async function requestUnlock() {
    writeHololockerUnlock?.();
  }

  return (
    <TransactionButton
      onClick={requestUnlock}
      isLoading={isLoadingHololockerUnlock}
      isPending={isPendingHololockerUnlock}
      disabled={tokenIds.length === 0}
      actionText={`Request unlock for all locked tokens (${tokenIds.length})`}
    />
  );
}
