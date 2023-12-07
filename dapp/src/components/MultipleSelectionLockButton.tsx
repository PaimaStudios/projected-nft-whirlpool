"use client";
import { Button, Stack, Typography } from "@mui/material";
import { Nft } from "alchemy-sdk";
import { useState } from "react";
import { TokenEVM } from "../utils/types";
import TransactionButton from "./TransactionButton";
import { hololockerConfig } from "../contracts";
import { erc721ABI, useAccount, useWaitForTransaction } from "wagmi";
import FunctionKey from "../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import {
  readContracts,
  writeContract,
  prepareWriteContract,
} from "@wagmi/core";
import ApproveCollectionDialog from "../dialogs/ApproveCollectionDialog";
import { useModal } from "mui-modal-provider";

type Props = {
  selectedTokens: TokenEVM[];
  setSelectedTokens: React.Dispatch<React.SetStateAction<TokenEVM[]>>;
  selectingMultipleLock: boolean;
  setSelectingMultipleLock: React.Dispatch<React.SetStateAction<boolean>>;
  nftGroups: Record<string, Nft[]>;
};

export default function MultipleSelectionLockButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleLock,
  setSelectingMultipleLock,
  nftGroups,
}: Props) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { showModal } = useModal();
  const [approvalTxHash, setApprovalTxHash] = useState<`0x${string}`>();
  const [lockTxHash, setLockTxHash] = useState<`0x${string}`>();
  const [isLoadingMultipleLock, setIsLoadingMultipleLock] = useState(false);

  const { isLoading: isPendingMultipleLock } = useWaitForTransaction({
    hash: lockTxHash,
    onSuccess: () => {
      setSelectingMultipleLock(false);
      setSelectedTokens([]);
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
    },
  });

  const { isLoading: isPendingSetApproval } = useWaitForTransaction({
    hash: approvalTxHash,
  });

  const handleClickRequestMultipleLockButton = async () => {
    if (!address) return;
    let request;
    try {
      request = (
        await prepareWriteContract({
          ...hololockerConfig,
          functionName: "lock",
          args: [
            selectedTokens.map((lock) => lock.token),
            selectedTokens.map((lock) => lock.tokenId),
            address,
          ],
        })
      ).request;
    } catch (err) {}
    if (request) {
      try {
        setIsLoadingMultipleLock(true);
        const { hash } = await writeContract(request);
        setLockTxHash(hash);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMultipleLock(false);
      }
    } else {
      const tokenContracts = Array.from(
        new Set(selectedTokens.map((token) => token.token)),
      );
      const approvals = await readContracts({
        contracts: tokenContracts.map((tokenContract) => {
          return {
            address: tokenContract,
            abi: erc721ABI,
            functionName: "isApprovedForAll",
            args: [address!, hololockerConfig.address],
          };
        }),
      });
      const needToApprove = approvals
        .map((data, index) => {
          return data.result ? null : tokenContracts[index];
        })
        .filter((contract) => contract != null) as `0x${string}`[];
      const modal = showModal(ApproveCollectionDialog, {
        tokens: needToApprove,
        onCancel: () => {
          modal.hide();
        },
        onSuccess: () => {},
        onTxSubmit: (hash) => {
          setApprovalTxHash(hash);
        },
      });
    }
  };

  return !selectingMultipleLock ? (
    Object.keys(nftGroups).length > 1 ? (
      <>
        <Button
          variant="contained"
          size="large"
          onClick={() => {
            setSelectingMultipleLock(!selectingMultipleLock);
          }}
        >
          Select multiple tokens to lock
        </Button>
        <Typography textAlign={"center"}>or lock per collections</Typography>
      </>
    ) : (
      <></>
    )
  ) : (
    <Stack sx={{ gap: 2 }}>
      {selectingMultipleLock && (
        <Stack
          sx={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <TransactionButton
            isLoading={isLoadingMultipleLock}
            isPending={isPendingMultipleLock || isPendingSetApproval}
            onClick={handleClickRequestMultipleLockButton}
            disabled={selectedTokens.length === 0}
            actionText={`Request lock for selected tokens`}
          />
          <Button
            onClick={() => {
              setSelectingMultipleLock(!selectingMultipleLock);
              setSelectedTokens([]);
            }}
            disabled={
              isLoadingMultipleLock ||
              isPendingMultipleLock ||
              isPendingSetApproval
            }
          >
            Cancel
          </Button>
        </Stack>
      )}

      <Typography textAlign={"center"}>
        Click token cards to select/deselect
      </Typography>
    </Stack>
  );
}
