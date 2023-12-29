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
import { Close } from "@mui/icons-material";

type InstallWalletDialogProps = {
  onCancel: () => void;
} & DialogProps;

const recommendedCardanoWallet = {
  name: "Flint",
  url: "https://flint-wallet.com/",
};

export default function InstallWalletDialog({
  onCancel,
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
        <DialogTitle>No wallet detected</DialogTitle>
        <DialogActions>
          <IconButton onClick={onCancel} aria-label="close">
            <Close />
          </IconButton>
        </DialogActions>
      </Stack>
      <DialogContent>
        <Typography>
          No Cardano wallet has been detected. Please install and enable one. We
          recommend using {recommendedCardanoWallet.name}.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button href={recommendedCardanoWallet.url} target="_blank">
          Install {recommendedCardanoWallet.name}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
