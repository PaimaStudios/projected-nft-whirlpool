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
import { useDappStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { cardanoWallets } from "../utils/cardano/constants";
import { AddressCardano } from "../components/AddressCardano";
import { useCardanoBalance } from "../hooks/useCardanoBalance";
import { formatLovelace } from "../utils/cardano/utils";
import { Close } from "@mui/icons-material";

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
      <Stack
        sx={{
          flexDirection: "row",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <DialogTitle>
          <Stack
            sx={{ flexDirection: "row", gap: 1, justifyContent: "center" }}
          >
            {selectedWallet?.name}
            <img
              src={selectedWallet.icon}
              alt={selectedWallet.name}
              style={{ height: 32, aspectRatio: 1 }}
            />
          </Stack>
        </DialogTitle>
        <DialogActions>
          <IconButton onClick={onCancel} aria-label="close">
            <Close />
          </IconButton>
        </DialogActions>
      </Stack>
      <DialogContent>
        <Stack sx={{ alignItems: "center" }}>
          <AddressCardano address={address ?? ""} />
          <Typography variant="caption">
            {formatLovelace(balance?.getLovelace() ?? 0n)} ₳
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={disconnect}>Disconnect</Button>
      </DialogActions>
    </Dialog>
  );
}
