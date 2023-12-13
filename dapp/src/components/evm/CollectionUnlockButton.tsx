"use client";
import { useAccount, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../utils/evm/contracts";
import TransactionButton from "../TransactionButton";
import FunctionKey from "../../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { SnackbarMessage } from "../../utils/texts";
import { writeContract } from "@wagmi/core";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function CollectionUnlockButton({ token, tokenIds }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}`>();

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: txHash,
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
    if (!address) return;
    setIsLoading(true);
    try {
      const { hash } = await writeContract({
        ...hololockerConfig,
        functionName: "requestUnlock",
        args: [Array(tokenIds.length).fill(token), tokenIds],
      });
      setTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <TransactionButton
      onClick={requestUnlock}
      isLoading={isLoading}
      isPending={isPending}
      disabled={tokenIds.length === 0}
      actionText={`Request unlock for all locked tokens (${tokenIds.length})`}
    />
  );
}
