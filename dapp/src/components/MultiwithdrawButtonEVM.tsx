"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import { usePrepareHololockerWithdraw } from "../generated";
import TransactionButton from "./TransactionButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function MultiwithdrawButtonEVM({ token, tokenIds }: Props) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { config: configHololockerWithdraw } = usePrepareHololockerWithdraw({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds],
    enabled: !!address,
  });

  const {
    write: writeHololockerWithdraw,
    data: dataHololockerWithdraw,
    isLoading: isLoadingHololockerWithdraw,
  } = useContractWrite(configHololockerWithdraw);

  const { isLoading: isPendingHololockerWithdraw } = useWaitForTransaction({
    hash: dataHololockerWithdraw?.hash,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
    },
  });

  async function withdraw() {
    writeHololockerWithdraw?.();
  }

  return (
    <TransactionButton
      onClick={withdraw}
      isLoading={isLoadingHololockerWithdraw}
      isPending={isPendingHololockerWithdraw}
      disabled={tokenIds.length === 0}
      actionText={`Withdraw all withdrawable tokens (${tokenIds.length})`}
    />
  );
}
