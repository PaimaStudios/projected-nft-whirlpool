"use client";
import { Stack, Typography } from "@mui/material";
import { useGetChainType } from "../hooks/useGetChainType";
import LockNftListEVM from "./LockNftListEVM";
import LockNftListCardano from "./LockNftListCardano";

export default function LockNftSection() {
  const chainType = useGetChainType();

  return (
    <Stack sx={{ gap: 2, mt: 4, alignItems: "center", width: "100%" }}>
      <Typography variant="h3">Project a token</Typography>
      {chainType === "EVM" ? <LockNftListEVM /> : <LockNftListCardano />}
    </Stack>
  );
}
