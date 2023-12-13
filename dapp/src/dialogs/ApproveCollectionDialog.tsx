import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useWaitForTransaction } from "wagmi";
import TransactionButton from "../components/TransactionButton";
import { useEffect, useState } from "react";
import { formatEVMAddress } from "../utils/evm/utils";
import CheckIcon from "@mui/icons-material/Check";
import { hololockerConfig } from "../utils/evm/contracts";
import { erc721ABI, writeContract } from "@wagmi/core";

type ApproveCollectionSectionProps = {
  onSuccess: () => void;
  onTxSubmit: (hash: `0x${string}`) => void;
  token: string;
};

type ApproveCollectionDialogProps = {
  onCancel: () => void;
  onSuccess: () => void;
  onTxSubmit: (hash: `0x${string}`) => void;
  tokens: string[];
} & DialogProps;

function ApproveCollectionSection({
  token,
  onSuccess,
  onTxSubmit,
}: ApproveCollectionSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}`>();

  const { isLoading: isPending, isSuccess } = useWaitForTransaction({
    hash: txHash,

    onSuccess: () => {
      onSuccess();
    },
  });

  useEffect(() => {
    if (isPending && txHash) {
      onTxSubmit(txHash);
    }
  }, [isPending]);

  async function handleClickApprove() {
    setIsLoading(true);
    try {
      const { hash } = await writeContract({
        abi: erc721ABI,
        address: token as `0x${string}`,
        functionName: "setApprovalForAll",
        args: [hololockerConfig.address, true],
      });
      setTxHash(hash);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
      <Typography>Approve {formatEVMAddress(token)}</Typography>
      {isSuccess ? (
        <CheckIcon />
      ) : (
        <TransactionButton
          onClick={handleClickApprove}
          isLoading={isLoading}
          isPending={isPending}
          actionText={`Approve`}
        />
      )}
    </Stack>
  );
}

export default function ApproveCollectionDialog({
  onCancel,
  onSuccess,
  onTxSubmit,
  tokens,
  ...props
}: ApproveCollectionDialogProps) {
  return (
    <Dialog {...props}>
      <Stack
        sx={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <DialogTitle>Approval needed</DialogTitle>
        <DialogActions>
          <IconButton onClick={onCancel} aria-label="close">
            <Close />
          </IconButton>
        </DialogActions>
      </Stack>
      <DialogContent>
        <Typography>
          If you want to lock multiple tokens in one transaction, you need to
          approve the Hololocker smart contract to transfer your NFTs.
        </Typography>
      </DialogContent>

      {tokens.map((token) => (
        <DialogActions key={token}>
          <ApproveCollectionSection
            token={token}
            onSuccess={onSuccess}
            onTxSubmit={onTxSubmit}
          />
        </DialogActions>
      ))}
    </Dialog>
  );
}
