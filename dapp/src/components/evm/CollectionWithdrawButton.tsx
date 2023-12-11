"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../utils/evm/contracts";
import { usePrepareHololockerWithdraw } from "../../generated";
import TransactionButton from "../TransactionButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SnackbarMessage } from "../../utils/texts";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function CollectionWithdrawButton({ token, tokenIds }: Props) {
  const { enqueueSnackbar } = useSnackbar();
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

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
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

  useEffect(() => {
    if (isPending) {
      enqueueSnackbar({
        message: SnackbarMessage.TransactionSubmitted,
        variant: "info",
      });
    }
  }, [isPending]);

  useEffect(() => {
    if (isSuccess) {
      enqueueSnackbar({
        message: SnackbarMessage.WithdrawSuccess,
        variant: "success",
      });
    }
  }, [isSuccess]);

  async function withdraw() {
    writeHololockerWithdraw?.();
  }

  return (
    <TransactionButton
      onClick={withdraw}
      isLoading={isLoadingHololockerWithdraw}
      isPending={isPending}
      disabled={tokenIds.length === 0}
      actionText={`Withdraw all withdrawable tokens (${tokenIds.length})`}
    />
  );
}
