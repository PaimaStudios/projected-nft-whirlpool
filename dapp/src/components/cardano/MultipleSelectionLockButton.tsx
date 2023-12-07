"use client";
import { Button, Stack, Typography } from "@mui/material";
import LockNftButton from "./LockNftButton";
import { Token } from "../../utils/cardano/token";
import { useState } from "react";
import { useSnackbar } from "notistack";
import { SnackbarMessage } from "../../utils/texts";

type Props = {
  selectedTokens: Token[];
  setSelectedTokens: React.Dispatch<React.SetStateAction<Token[]>>;
  selectingMultipleLock: boolean;
  setSelectingMultipleLock: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function MultipleSelectionLockButton({
  selectedTokens,
  setSelectedTokens,
  selectingMultipleLock,
  setSelectingMultipleLock,
}: Props) {
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  return !selectingMultipleLock ? (
    <>
      <Button
        variant="contained"
        size="large"
        onClick={() => {
          enqueueSnackbar({
            message: SnackbarMessage.TransactionSubmitted,
            variant: "info",
          });
        }}
      >
        Select multiple tokens to lock
      </Button>
      <Typography textAlign={"center"}>or lock individually</Typography>
    </>
  ) : (
    <Stack sx={{ gap: 2 }} component={"section"}>
      {selectingMultipleLock && (
        <Stack
          sx={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <LockNftButton
            tokens={selectedTokens}
            actionText="Lock selected tokens"
            disabled={selectedTokens.length === 0}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isPending={isPending}
            setIsPending={setIsPending}
          />
          <Button
            onClick={() => {
              setSelectingMultipleLock(!selectingMultipleLock);
              setSelectedTokens([]);
            }}
            disabled={isLoading || isPending}
          >
            Cancel
          </Button>
        </Stack>
      )}

      {!isLoading && !isPending && (
        <Typography textAlign={"center"}>
          Click token cards to select/deselect
        </Typography>
      )}
    </Stack>
  );
}
