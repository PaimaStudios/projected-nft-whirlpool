"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../utils/evm/contracts";
import { usePrepareHololockerRequestUnlock } from "../../generated";
import TransactionButton from "../TransactionButton";
import FunctionKey from "../../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SnackbarMessage } from "../../utils/texts";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function CollectionUnlockButton({ token, tokenIds }: Props) {
  const { enqueueSnackbar } = useSnackbar();
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

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: dataHololockerUnlock?.hash,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
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
        message: SnackbarMessage.LockSuccess,
        variant: "success",
      });
    }
  }, [isSuccess]);

  async function requestUnlock() {
    writeHololockerUnlock?.();
  }

  return (
    <TransactionButton
      onClick={requestUnlock}
      isLoading={isLoadingHololockerUnlock}
      isPending={isPending}
      disabled={tokenIds.length === 0}
      actionText={`Request unlock for all locked tokens (${tokenIds.length})`}
    />
  );
}
