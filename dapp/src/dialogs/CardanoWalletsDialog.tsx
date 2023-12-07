import {
  Dialog,
  DialogActions,
  DialogProps,
  DialogTitle,
  IconButton,
  MenuItem,
  MenuList,
  Stack,
  Typography,
} from "@mui/material";
import { useDappStore } from "../store";
import { useModal } from "mui-modal-provider";
import InstallWalletDialog from "./InstallWalletDialog";
import { Check, Close } from "@mui/icons-material";
import { CardanoWalletInfo } from "../utils/cardano/types";
import { cardanoWallets } from "../utils/cardano/constants";

type CardanoWalletsDialogProps = {
  onCancel: () => void;
} & DialogProps;

export default function CardanoWalletsDialog({
  onCancel,
  ...props
}: CardanoWalletsDialogProps) {
  const { showModal } = useModal();
  const selectWallet = useDappStore((state) => state.selectWallet);
  const selectedWalletKey = useDappStore((state) => state.selectedWallet);

  const walletInstalled = (walletKey: string) => {
    if (typeof window !== "undefined" && window.cardano) {
      return window.cardano[walletKey] !== undefined;
    }

    return false;
  };

  const connectWallet = async (walletInfo: CardanoWalletInfo) => {
    if (typeof window !== "undefined" && window.cardano) {
      if (window.cardano[walletInfo.key]) {
        try {
          const walletApi = await window.cardano[walletInfo.key].enable();
          if (walletApi) {
            selectWallet(walletInfo.key);
            onCancel();
          }
        } catch (_) {}
      } else {
        const modal = showModal(InstallWalletDialog, {
          walletInfo,
          onCancel: () => {
            modal.hide();
          },
        });
      }
    }
  };

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
        <DialogTitle>Choose a wallet</DialogTitle>
        <DialogActions>
          <IconButton onClick={onCancel} aria-label="close">
            <Close />
          </IconButton>
        </DialogActions>
      </Stack>
      <MenuList sx={{ pb: 0 }}>
        {cardanoWallets.map((wallet) => {
          const installed = walletInstalled(wallet.key);
          const selected = wallet.key === selectedWalletKey;
          return (
            <MenuItem onClick={() => connectWallet(wallet)} key={wallet.key}>
              <Stack
                sx={{
                  flexDirection: "row",
                  gap: 2,
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <img
                  src={wallet.icon}
                  alt={wallet.name}
                  style={{ height: 32, aspectRatio: 1 }}
                />
                <Typography sx={{ flexGrow: 1 }}>{wallet.name}</Typography>
                {!installed && (
                  <Typography variant="caption">Not installed</Typography>
                )}
                {selected && <Check />}
              </Stack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Dialog>
  );
}
