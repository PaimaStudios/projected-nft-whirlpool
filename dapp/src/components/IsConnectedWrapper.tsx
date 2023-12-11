import { Stack, Typography } from "@mui/material";
import { PropsWithChildren } from "react";
import ConnectWallet from "./ConnectWallet";
import { useGetChainType } from "../hooks/useGetChainType";
import { isChainSupported } from "../utils/evm/chains";
import { useNetwork } from "wagmi";
import ChainSelector from "./ChainSelector";

export default function IsConnectedWrapper({ children }: PropsWithChildren) {
  const chainType = useGetChainType();
  const { chain } = useNetwork();
  const unsupportedChain = isChainSupported(chain?.id);

  if (chainType == null) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center" }}>
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

  if (chainType === "EVM" && !unsupportedChain) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center" }}>
        <Typography>You are using an unsupported network.</Typography>
        <ChainSelector text="Switch network" />
      </Stack>
    );
  }
  return <>{children}</>;
}
