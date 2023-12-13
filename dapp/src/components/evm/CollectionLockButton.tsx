"use client";
import { useAccount, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../utils/evm/contracts";
import { useErc721IsApprovedForAll } from "../../generated";
import TransactionButton from "../TransactionButton";
import FunctionKey from "../../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { useModal } from "mui-modal-provider";
import ApproveCollectionDialog from "../../dialogs/ApproveCollectionDialog";
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { SnackbarMessage } from "../../utils/texts";
import { writeContract } from "@wagmi/core";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function CollectionLockButton({ token, tokenIds }: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { showModal } = useModal();
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}`>();
  const [isLoading, setIsLoading] = useState(false);
  const [lockTxHash, setLockTxHash] = useState<`0x${string}`>();

  const { data: isApproved, refetch: refetchIsApproved } =
    useErc721IsApprovedForAll({
      address: token as `0x${string}`,
      args: [address!, hololockerConfig.address],
      enabled: !!address,
    });

  const { isLoading: isPendingHololockerLock, isSuccess: isSuccessLock } =
    useWaitForTransaction({
      hash: lockTxHash,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [FunctionKey.NFTS],
        });
        queryClient.invalidateQueries({
          queryKey: [FunctionKey.LOCKS],
        });
      },
    });

  const { isLoading: isPendingSetApproval, isSuccess: isSuccessApproval } =
    useWaitForTransaction({
      hash: approvalTxHash,
      onSuccess: () => {
        refetchIsApproved();
      },
    });

  useEffect(() => {
    if (isPendingHololockerLock || isPendingSetApproval) {
      enqueueSnackbar({
        message: SnackbarMessage.TransactionSubmitted,
        variant: "info",
      });
    }
  }, [isPendingHololockerLock, isPendingSetApproval]);

  useEffect(() => {
    if (isSuccessLock) {
      enqueueSnackbar({
        message: SnackbarMessage.LockSuccess,
        variant: "success",
      });
    }
  }, [isSuccessLock]);

  useEffect(() => {
    if (isSuccessApproval) {
      enqueueSnackbar({
        message: SnackbarMessage.ApprovalSuccess,
        variant: "success",
      });
    }
  }, [isSuccessApproval]);

  async function handleClickButton() {
    if (isApproved) {
      if (!address) return;
      setIsLoading(true);
      try {
        const { hash } = await writeContract({
          ...hololockerConfig,
          functionName: "lock",
          args: [Array(tokenIds.length).fill(token), tokenIds, address!],
        });
        setLockTxHash(hash);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    } else {
      const modal = showModal(ApproveCollectionDialog, {
        tokens: [token],
        onCancel: () => {
          modal.hide();
        },
        onSuccess: () => {
          refetchIsApproved();
        },
        onTxSubmit: (hash) => {
          refetchIsApproved();
          setApprovalTxHash(hash);
        },
      });
    }
  }

  return (
    <TransactionButton
      onClick={handleClickButton}
      isLoading={isLoading}
      isPending={isPendingHololockerLock || isPendingSetApproval}
      actionText={"Lock all NFTs in this collection"}
    />
  );
}
