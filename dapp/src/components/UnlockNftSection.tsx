"use client";
import { Stack, Typography } from "@mui/material";
import UnlockNftListEVM from "./evm/UnlockNftList";
import { useGetChainType } from "../hooks/useGetChainType";
import UnlockNftListCardano from "./cardano/UnlockNftList";

export default function UnlockNftSection() {
  const chainType = useGetChainType();
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Typography variant="h3">Projected tokens</Typography>
      {chainType === "EVM" ? (
        <UnlockNftListEVM />
      ) : chainType === "Cardano" ? (
        <UnlockNftListCardano />
      ) : (
        <></>
      )}
    </Stack>
  );
}
