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
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import TransactionButton from "../components/TransactionButton";
import { useEffect } from "react";

type ApproveCollectionDialogProps = {
  onCancel: () => void;
  onSuccess: () => void;
  onTxSubmit: (hash: `0x${string}`) => void;
  token: string;
} & DialogProps;

export default function ApproveCollectionDialog({
  onCancel,
  onSuccess,
  onTxSubmit,
  token,
  ...props
}: ApproveCollectionDialogProps) {
  const { address } = useAccount();

  const { config: configSetApproval } = usePrepareErc721SetApprovalForAll({
    address: token as `0x${string}`,
    args: [hololockerConfig.address, true],
    enabled: !!address,
  });

  const {
    write: writeSetApproval,
    data: dataSetApproval,
    isLoading: isLoadingSetApproval,
  } = useContractWrite(configSetApproval);

  const { isLoading: isPendingSetApproval } = useWaitForTransaction({
    hash: dataSetApproval?.hash,

    onSuccess: () => {
      onSuccess();
      onCancel();
    },
  });

  useEffect(() => {
    if (isPendingSetApproval && dataSetApproval) {
      onTxSubmit(dataSetApproval.hash);
    }
  }, [isPendingSetApproval]);

  function handleClickApprove() {
    writeSetApproval?.();
  }
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
          approve our smart contract to transfer your NFTs.
        </Typography>
      </DialogContent>
      <DialogActions>
        <TransactionButton
          onClick={handleClickApprove}
          isLoading={isLoadingSetApproval}
          isPending={isPendingSetApproval}
          actionText={"Approve collection for multilock"}
        />
      </DialogActions>
    </Dialog>
  );
}
