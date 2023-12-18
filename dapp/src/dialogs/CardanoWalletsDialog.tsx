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
import { Check, Close } from "@mui/icons-material";
import { connectWallet, getCardanoWallets } from "../utils/cardano/utils";

type CardanoWalletsDialogProps = {
  onCancel: () => void;
  wallets: ReturnType<typeof getCardanoWallets>;
} & DialogProps;

export default function CardanoWalletsDialog({
  onCancel,
  wallets,
  ...props
}: CardanoWalletsDialogProps) {
  const selectWallet = useDappStore((state) => state.selectWallet);
  const selectedWalletKey = useDappStore((state) => state.selectedWallet);

  const walletInstalled = (walletKey: string) => {
    if (typeof window !== "undefined" && window.cardano) {
      return window.cardano[walletKey] !== undefined;
    }

    return false;
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
      <MenuList>
        {wallets.map((wallet) => {
          const installed = walletInstalled(wallet.key);
          const selected = wallet.key === selectedWalletKey;
          return (
            <MenuItem
              onClick={async () => {
                await connectWallet(wallet, selectWallet);
                onCancel();
              }}
              key={wallet.key}
            >
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
