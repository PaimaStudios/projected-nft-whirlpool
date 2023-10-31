import { Stack, Typography } from "@mui/material";
import { PropsWithChildren } from "react";
import ConnectWallet from "./ConnectWallet";
import { useGetChainType } from "../hooks/useGetChainType";

export default function IsConnectedWrapper({ children }: PropsWithChildren) {
  const chainType = useGetChainType();
  return (
    <>
      {chainType ? (
        <>{children}</>
      ) : (
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
      )}
    </>
  );
}
