import {
  Button,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  Typography,
} from "@mui/material";
import { CardanoWalletInfo } from "../utils/types";

type InstallWalletDialogProps = {
  walletInfo: CardanoWalletInfo;
} & DialogProps;

export default function InstallWalletDialog({
  walletInfo,
  ...props
}: InstallWalletDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTitle>{walletInfo.name} wallet not installed</DialogTitle>
      <DialogContent>
        <Typography>
          Please install and enable {walletInfo.name} wallet extension!
        </Typography>
      </DialogContent>
      <Button href={walletInfo.url} target="_blank">
        Install extension
      </Button>
    </Dialog>
  );
}
