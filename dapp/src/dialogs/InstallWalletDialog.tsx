import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { CardanoWalletInfo } from "../utils/cardano/types";
import { Close } from "@mui/icons-material";

type InstallWalletDialogProps = {
  onCancel: () => void;
  walletInfo: CardanoWalletInfo;
} & DialogProps;

export default function InstallWalletDialog({
  onCancel,
  walletInfo,
  ...props
}: InstallWalletDialogProps) {
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
        <DialogTitle>{walletInfo.name} wallet not installed</DialogTitle>
        <DialogActions>
          <IconButton onClick={onCancel} aria-label="close">
            <Close />
          </IconButton>
        </DialogActions>
      </Stack>
      <DialogContent>
        <Typography>
          Please install and enable {walletInfo.name} wallet extension!
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button href={walletInfo.url} target="_blank">
          Install extension
        </Button>
      </DialogActions>
    </Dialog>
  );
}
