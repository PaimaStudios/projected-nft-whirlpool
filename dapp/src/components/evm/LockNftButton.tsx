"use client";
import { erc721ABI, useAccount, useWaitForTransaction } from "wagmi";
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
  tokenId: bigint;
};

export default function LockNftButton({ token, tokenId }: Props) {
  const { address } = useAccount();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}`>();

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: txHash,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
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

  async function lockNft() {
    if (!address) return;
    setIsLoading(true);
    try {
      const { hash } = await writeContract({
        abi: erc721ABI,
        address: token as `0x${string}`,
        functionName: "safeTransferFrom",
        args: [address, hololockerConfig.address, tokenId],
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
      onClick={lockNft}
      isLoading={isLoading}
      isPending={isPending}
      actionText={"Lock NFT"}
    />
  );
}
