import { Stack, Typography } from "@mui/material";
import { PropsWithChildren } from "react";
import ConnectWallet from "./ConnectWallet";
import { useGetVmType } from "../hooks/useGetVmType";
import { isChainSupported } from "../utils/evm/chains";
import { useNetwork } from "wagmi";
import ChainSelector from "./ChainSelector";
import { VmTypes } from "../utils/constants";

export default function IsConnectedWrapper({ children }: PropsWithChildren) {
  const vmType = useGetVmType();
  const { chain } = useNetwork();
  const supportedChain = isChainSupported(chain?.id);

  if (vmType === VmTypes.None) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center", textAlign: "center" }}>
        <Typography>
          Connect your wallet to get started with using the Projected NFT
          Whirlpool dApp
        </Typography>
        <ConnectWallet
          popoverAnchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          popoverTransformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        />
      </Stack>
    );
  }

  if (vmType === VmTypes.EVM && !supportedChain) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center" }}>
        <Typography>You are using an unsupported network.</Typography>
        <ChainSelector text="Switch network" />
      </Stack>
    );
  }
  return <>{children}</>;
}
