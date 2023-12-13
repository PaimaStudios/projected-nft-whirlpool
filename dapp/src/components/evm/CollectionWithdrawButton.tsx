"use client";
import { useAccount, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../utils/evm/contracts";
import TransactionButton from "../TransactionButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { SnackbarMessage } from "../../utils/texts";
import { writeContract } from "@wagmi/core";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function CollectionWithdrawButton({ token, tokenIds }: Props) {
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
    if (!address) return;
    setIsLoading(true);
    try {
      const { hash } = await writeContract({
        ...hololockerConfig,
        functionName: "withdraw",
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
      onClick={withdraw}
      isLoading={isLoading}
      isPending={isPending}
      disabled={tokenIds.length === 0}
      actionText={`Withdraw all withdrawable tokens (${tokenIds.length})`}
    />
  );
}
