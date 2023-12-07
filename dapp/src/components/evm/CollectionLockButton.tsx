"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../../contracts";
import {
  useErc721IsApprovedForAll,
  usePrepareHololockerLock,
} from "../../generated";
import TransactionButton from "../TransactionButton";
import FunctionKey from "../../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { useModal } from "mui-modal-provider";
import ApproveCollectionDialog from "../../dialogs/ApproveCollectionDialog";
import { useEffect, useState } from "react";
import { useSnackbar } from "notistack";
import { SnackbarMessage } from "../../utils/texts";

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

  const { data: isApproved, refetch: refetchIsApproved } =
    useErc721IsApprovedForAll({
      address: token as `0x${string}`,
      args: [address!, hololockerConfig.address],
      enabled: !!address,
    });

  const { config: configHololockerLock } = usePrepareHololockerLock({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds, address!],
    enabled: !!address && !!isApproved,
  });

  const {
    write: writeHololockerLock,
    data: dataHololockerLock,
    isLoading: isLoadingHololockerLock,
  } = useContractWrite(configHololockerLock);

  const { isLoading: isPendingHololockerLock, isSuccess: isSuccessLock } =
    useWaitForTransaction({
      hash: dataHololockerLock?.hash,
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
      writeHololockerLock?.();
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
      isLoading={isLoadingHololockerLock}
      isPending={isPendingHololockerLock || isPendingSetApproval}
      actionText={"Lock all NFTs in this collection"}
    />
  );
}
