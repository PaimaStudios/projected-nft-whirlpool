"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../contracts";
import { usePrepareErc721SafeTransferFrom } from "../../generated";
import TransactionButton from "../TransactionButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { SnackbarMessage } from "../../utils/texts";

type Props = {
  token: string;
  tokenId: bigint;
};

export default function LockNftButton({ token, tokenId }: Props) {
  const { address } = useAccount();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { config } = usePrepareErc721SafeTransferFrom({
    address: token as `0x${string}`,
    args: [address!, hololockerConfig.address, tokenId],
    enabled: !!address,
  });

  const { write, data, isLoading } = useContractWrite(config);

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
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
