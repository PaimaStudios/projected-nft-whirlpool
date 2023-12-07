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
  selectingMultipleWithdraw: boolean;
  setSelectingMultipleWithdraw: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function MultipleSelectionWithdrawButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleWithdraw,
  setSelectingMultipleWithdraw,
}: Props) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const [withdrawTxHash, setWithdrawTxHash] = useState<`0x${string}`>();
  const [isLoadingMultipleWithdraw, setIsLoadingMultipleWithdraw] =
    useState(false);

  const { isLoading: isPendingMultipleWithdraw } = useWaitForTransaction({
    hash: withdrawTxHash,
    onSuccess: () => {
      setSelectingMultipleWithdraw(false);
      setSelectedTokens([]);
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

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
          <TransactionButton
            isLoading={isLoadingMultipleWithdraw}
            isPending={isPendingMultipleWithdraw}
            onClick={handleClickRequestMultipleWithdrawButton}
            disabled={selectedTokens.length === 0}
            actionText={`Withdraw selected tokens`}
          />
          <Button
            onClick={() => {
              setSelectingMultipleWithdraw(!selectingMultipleWithdraw);
              setSelectedTokens([]);
            }}
            disabled={isLoadingMultipleWithdraw || isPendingMultipleWithdraw}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {!isLoadingMultipleWithdraw && !isPendingMultipleWithdraw && (
        <Typography textAlign={"center"}>
          Click token cards to select/deselect
        </Typography>
      )}
    </Stack>
  );
}
