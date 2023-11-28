import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useDappStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { cardanoWallets } from "../utils/cardano/constants";

type WalletInfoDialogProps = {
  onCancel: () => void;
} & DialogProps;

export default function WalletInfoDialog({
  onCancel,
  ...props
}: WalletInfoDialogProps) {
  const { address, selectWallet, selectedWalletKey } = useDappStore(
    useShallow((state) => ({
      address: state.address,
      selectWallet: state.selectWallet,
      selectedWalletKey: state.selectedWallet,
    })),
  );
  const disconnect = () => {
    selectWallet(undefined);
    onCancel();
  };
  const selectedWallet = cardanoWallets.find(
    (wallet) => wallet.key === selectedWalletKey,
  );
  return (
    <Dialog {...props}>
      <DialogTitle>Connected wallet - {selectedWallet?.name}</DialogTitle>
      <DialogContent>
        <Typography sx={{ overflowWrap: "anywhere" }}>{address}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={disconnect}>Disconnect</Button>
      </DialogActions>
    </Dialog>
  );
}
