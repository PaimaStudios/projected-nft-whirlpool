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
import { usePrepareErc721SetApprovalForAll } from "../generated";
import { hololockerConfig } from "../contracts";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import TransactionButton from "../components/TransactionButton";
import { useEffect } from "react";
import { formatEVMAddress } from "../utils/evm/utils";
import CheckIcon from "@mui/icons-material/Check";

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
  const { config: configSetApproval } = usePrepareErc721SetApprovalForAll({
    address: token as `0x${string}`,
    args: [hololockerConfig.address, true],
  });

  const {
    write: writeSetApproval,
    data: dataSetApproval,
    isLoading: isLoadingSetApproval,
  } = useContractWrite(configSetApproval);

  const { isLoading: isPendingSetApproval, isSuccess } = useWaitForTransaction({
    hash: dataSetApproval?.hash,

    onSuccess: () => {
      onSuccess();
    },
  });

  useEffect(() => {
    if (isPendingSetApproval && dataSetApproval) {
      onTxSubmit(dataSetApproval.hash);
    }
  }, [isPendingSetApproval]);

  async function handleClickApprove() {
    writeSetApproval?.();
  }

  return (
    <Stack sx={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
      <Typography>Approve {formatEVMAddress(token)}</Typography>
      {isSuccess ? (
        <CheckIcon />
      ) : (
        <TransactionButton
          onClick={handleClickApprove}
          isLoading={isLoadingSetApproval}
          isPending={isPendingSetApproval}
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
