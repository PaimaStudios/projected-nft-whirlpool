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
  selectingMultipleWithdraw: boolean;
  setSelectingMultipleWithdraw: React.Dispatch<React.SetStateAction<boolean>>;
  selectAllTokens: () => void;
};

export default function MultipleSelectionWithdrawButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleWithdraw,
  setSelectingMultipleWithdraw,
  selectAllTokens,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}`>();
  const [isLoadingMultipleWithdraw, setIsLoadingMultipleWithdraw] =
    useState(false);

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: withdrawTxHash,
    onSuccess: () => {
      setSelectingMultipleWithdraw(false);
      setSelectedTokens([]);
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

  const handleClickRequestMultipleWithdrawButton = async () => {
    if (!address) return;
    try {
      setIsLoadingMultipleWithdraw(true);
      const { hash } = await writeContract({
        ...hololockerConfig,
        functionName: "withdraw",
        args: [
          selectedTokens.map((lock) => lock.token),
          selectedTokens.map((lock) => lock.tokenId),
        ],
      });
      setWithdrawTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMultipleWithdraw(false);
    }
  };

  return !selectingMultipleWithdraw ? (
    <Button
      variant="contained"
      size="large"
      onClick={() => {
        setSelectingMultipleWithdraw(!selectingMultipleWithdraw);
      }}
    >
      Select multiple tokens to withdraw
    </Button>
  ) : (
    <Stack sx={{ gap: 2 }}>
      {selectingMultipleWithdraw && (
        <Stack
          sx={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <Button
            onClick={selectAllTokens}
            disabled={isLoadingMultipleWithdraw || isPending}
          >
            Select all
          </Button>
          <TransactionButton
            isLoading={isLoadingMultipleWithdraw}
            isPending={isPending}
            onClick={handleClickRequestMultipleWithdrawButton}
            disabled={selectedTokens.length === 0}
            actionText={`Withdraw selected tokens`}
          />
          <Button
            onClick={() => {
              setSelectingMultipleWithdraw(!selectingMultipleWithdraw);
              setSelectedTokens([]);
            }}
            disabled={isLoadingMultipleWithdraw || isPending}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {!isLoadingMultipleWithdraw && !isPending && (
        <Typography textAlign={"center"}>
          Click token cards to select/deselect
        </Typography>
      )}
    </Stack>
  );
}
