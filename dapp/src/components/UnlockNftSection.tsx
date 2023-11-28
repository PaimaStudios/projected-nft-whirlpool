"use client";
import { Stack, Typography } from "@mui/material";
import UnlockNftListEVM from "./UnlockNftListEVM";
import { useGetChainType } from "../hooks/useGetChainType";
import UnlockNftListCardano from "./UnlockNftListCardano";

export default function UnlockNftSection() {
  const chainType = useGetChainType();
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Typography variant="h3">Locked tokens</Typography>
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
