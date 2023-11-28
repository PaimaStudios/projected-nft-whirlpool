import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useDappStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { cardanoWallets } from "../utils/cardano/constants";
import { AddressCardano } from "../components/AddressCardano";
import { useCardanoBalance } from "../hooks/useCardanoBalance";
import { formatLovelace } from "../utils/cardano/utils";

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
  const { data: balance } = useCardanoBalance();
  const disconnect = () => {
    selectWallet(undefined);
    onCancel();
  };
  const selectedWallet = cardanoWallets.find(
    (wallet) => wallet.key === selectedWalletKey,
  );
  if (!selectedWallet) {
    return <></>;
  }
  return (
    <Dialog {...props}>
      <DialogTitle>
        <Stack sx={{ flexDirection: "row", gap: 1 }}>
          Connected wallet - {selectedWallet?.name}
          <img
            src={selectedWallet.icon}
            alt={selectedWallet.name}
            style={{ height: 32, aspectRatio: 1 }}
          />
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack>
          <Stack sx={{ flexDirection: "row", gap: 1 }}>
            <Typography>Address: </Typography>
            <AddressCardano address={address ?? ""} />
          </Stack>
          <Stack sx={{ flexDirection: "row", gap: 1 }}>
            <Typography>Balance: </Typography>
            {formatLovelace(balance?.getLovelace() ?? 0n)} ₳
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={disconnect}>Disconnect</Button>
      </DialogActions>
    </Dialog>
  );
}
