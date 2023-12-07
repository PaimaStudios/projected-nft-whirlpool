import {
  Button,
  CircularProgress,
  Popover,
  PopoverOrigin,
  Stack,
} from "@mui/material";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import React from "react";
import { useAccount } from "wagmi";
import { useGetChainType } from "../hooks/useGetChainType";
import { useModal } from "mui-modal-provider";
import CardanoWalletsDialog from "../dialogs/CardanoWalletsDialog";
import { useDappStore } from "../store";
import WalletInfoDialog from "../dialogs/WalletInfoDialog";
import { formatCardanoAddress } from "../utils/cardano/utils";
import { formatEVMAddress } from "../utils/evm/utils";

type Props = {
  popoverAnchorOrigin?: PopoverOrigin;
  popoverTransformOrigin?: PopoverOrigin;
};

export default function ConnectWallet({
  popoverAnchorOrigin = {
    vertical: "bottom",
    horizontal: "right",
  },
  popoverTransformOrigin = {
    vertical: "top",
    horizontal: "right",
  },
}: Props) {
  const { showModal } = useModal();
  const { openConnectModal: openConnectModalEVM } = useConnectModal();
  const { openAccountModal: openAccountModalEVM } = useAccountModal();
  const chainType = useGetChainType();
  const { address: addressEVM } = useAccount();
  const address = useDappStore((state) => state.address);

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openEVMConnect = () => {
    openConnectModalEVM?.();
    handleClose();
  };

  const openCardanoConnect = () => {
    const modal = showModal(CardanoWalletsDialog, {
      onCancel: () => {
        modal.hide();
      },
    });
    handleClose();
  };

  const handleClickWhenConnected = () => {
    if (chainType === "EVM") {
      openAccountModalEVM?.();
    } else if (chainType === "Cardano") {
      const modal = showModal(WalletInfoDialog, {
        onCancel: () => {
          modal.hide();
        },
      });
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "chains-popover" : undefined;
  const formattedAddress =
    chainType === "EVM"
      ? formatEVMAddress(addressEVM)
      : chainType === "Cardano"
      ? formatCardanoAddress(address)
      : "";
  return (
    <>
      {chainType == null ? (
        <Button aria-describedby={id} onClick={handleClick}>
          Connect wallet
        </Button>
      ) : formattedAddress ? (
        <Button aria-describedby={id} onClick={handleClickWhenConnected}>
          {formattedAddress}
        </Button>
      ) : (
        <CircularProgress />
      )}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={popoverAnchorOrigin}
        transformOrigin={popoverTransformOrigin}
      >
        <Stack>
          <Button variant="text" onClick={openEVMConnect}>
            EVM
          </Button>
          <Button variant="text" onClick={openCardanoConnect}>
            Cardano
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
