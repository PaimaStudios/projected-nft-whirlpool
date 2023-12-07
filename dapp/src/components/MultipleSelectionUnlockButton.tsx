"use client";
import { Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { TokenEVM } from "../utils/types";
import TransactionButton from "./TransactionButton";
import { hololockerConfig } from "../contracts";
import { useAccount, useWaitForTransaction } from "wagmi";
import FunctionKey from "../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";

type Props = {
  selectedTokens: TokenEVM[];
  setSelectedTokens: React.Dispatch<React.SetStateAction<TokenEVM[]>>;
  selectingMultipleUnlock: boolean;
  setSelectingMultipleUnlock: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function MultipleSelectionUnlockButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleUnlock,
  setSelectingMultipleUnlock,
}: Props) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [unlockTxHash, setUnlockTxHash] = useState<`0x${string}`>();
  const [isLoadingMultipleUnlock, setIsLoadingMultipleUnlock] = useState(false);

  const { isLoading: isPendingMultipleUnlock } = useWaitForTransaction({
    hash: unlockTxHash,
    onSuccess: () => {
      setSelectingMultipleUnlock(false);
      setSelectedTokens([]);
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

  const handleClickRequestMultipleUnlockButton = async () => {
    if (!address) return;
    try {
      setIsLoadingMultipleUnlock(true);
      const { hash } = await writeContract({
        ...hololockerConfig,
        functionName: "requestUnlock",
        args: [
          selectedTokens.map((lock) => lock.token),
          selectedTokens.map((lock) => lock.tokenId),
        ],
      });
      setUnlockTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMultipleUnlock(false);
    }
  };

  return !selectingMultipleUnlock ? (
    <Button
      variant="contained"
      size="large"
      onClick={() => {
        setSelectingMultipleUnlock(!selectingMultipleUnlock);
      }}
    >
      Select multiple tokens to unlock
    </Button>
  ) : (
    <Stack sx={{ gap: 2 }}>
      {selectingMultipleUnlock && (
        <Stack
          sx={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <TransactionButton
            isLoading={isLoadingMultipleUnlock}
            isPending={isPendingMultipleUnlock}
            onClick={handleClickRequestMultipleUnlockButton}
            disabled={selectedTokens.length === 0}
            actionText={`Request unlock for selected tokens`}
          />
          <Button
            onClick={() => {
              setSelectingMultipleUnlock(!selectingMultipleUnlock);
              setSelectedTokens([]);
            }}
            disabled={isLoadingMultipleUnlock || isPendingMultipleUnlock}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {!isLoadingMultipleUnlock && !isPendingMultipleUnlock && (
        <Typography textAlign={"center"}>
          Click token cards to select/deselect
        </Typography>
      )}
    </Stack>
  );
}
