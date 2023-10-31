import { Button, Popover, PopoverOrigin, Stack } from "@mui/material";
import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import React from "react";
import { useAccount } from "wagmi";
import { useGetChainType } from "../hooks/useGetChainType";

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
  const { openConnectModal: openConnectModalEVM } = useConnectModal();
  const { openAccountModal: openAccountModalEVM } = useAccountModal();
  const chainType = useGetChainType();
  const { address: addressEVM } = useAccount();

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

  const open = Boolean(anchorEl);
  const id = open ? "chains-popover" : undefined;
  return (
    <>
      {chainType == null ? (
        <Button aria-describedby={id} onClick={handleClick}>
          Connect wallet
        </Button>
      ) : (
        <Button aria-describedby={id} onClick={openAccountModalEVM}>
          {chainType === "EVM" ? addressEVM : ""}
        </Button>
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
          <Button variant="text" disabled>
            Cardano (coming soon)
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
