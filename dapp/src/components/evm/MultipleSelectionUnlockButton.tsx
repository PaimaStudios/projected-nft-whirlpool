"use client";
import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { TokenEVM } from "../../utils/evm/types";
import TransactionButton from "../TransactionButton";
import { hololockerConfig } from "../../utils/evm/contracts";
import { useAccount, useWaitForTransaction } from "wagmi";
import FunctionKey from "../../utils/functionKey";
import { useQueryClient } from "@tanstack/react-query";
import { writeContract } from "@wagmi/core";
import { useSnackbar } from "notistack";
import { SnackbarMessage } from "../../utils/texts";

type Props = {
  selectedTokens: TokenEVM[];
  setSelectedTokens: React.Dispatch<React.SetStateAction<TokenEVM[]>>;
  selectingMultipleUnlock: boolean;
  setSelectingMultipleUnlock: React.Dispatch<React.SetStateAction<boolean>>;
  selectAllTokens: () => void;
};

export default function MultipleSelectionUnlockButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleUnlock,
  setSelectingMultipleUnlock,
  selectAllTokens,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [unlockTxHash, setUnlockTxHash] = useState<`0x${string}`>();
  const [isLoadingMultipleUnlock, setIsLoadingMultipleUnlock] = useState(false);

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: unlockTxHash,
    onSuccess: () => {
      setSelectingMultipleUnlock(false);
      setSelectedTokens([]);
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
        message: SnackbarMessage.UnlockSuccess,
        variant: "success",
      });
    }
  }, [isSuccess]);

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
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            onClick={selectAllTokens}
            disabled={isLoadingMultipleUnlock || isPending}
          >
            Select all
          </Button>
          <TransactionButton
            isLoading={isLoadingMultipleUnlock}
            isPending={isPending}
            onClick={handleClickRequestMultipleUnlockButton}
            disabled={selectedTokens.length === 0}
            actionText={`Request unlock for selected tokens`}
          />
          <Button
            onClick={() => {
              setSelectingMultipleUnlock(!selectingMultipleUnlock);
              setSelectedTokens([]);
            }}
            disabled={isLoadingMultipleUnlock || isPending}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {!isLoadingMultipleUnlock && !isPending && (
        <Typography textAlign={"center"}>
          Click token cards to select/deselect
        </Typography>
      )}
    </Stack>
  );
}
