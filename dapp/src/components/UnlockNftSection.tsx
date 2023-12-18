"use client";
import { Stack, Typography } from "@mui/material";
import UnlockNftListEVM from "./evm/UnlockNftList";
import { useGetVmType } from "../hooks/useGetVmType";
import UnlockNftListCardano from "./cardano/UnlockNftList";
import { VmTypes } from "../utils/constants";
import assertNever from "assert-never";

export default function UnlockNftSection() {
  const vmType = useGetVmType();
  return (
    <Stack sx={{ alignItems: "center", gap: 2, width: "100%" }}>
      <Typography variant="h3" textAlign={"center"}>
        Projected tokens
      </Typography>
      {vmType === VmTypes.None ? (
        <></>
      ) : vmType === VmTypes.EVM ? (
        <UnlockNftListEVM />
      ) : vmType === VmTypes.Cardano ? (
        <UnlockNftListCardano />
      ) : (
        assertNever(vmType)
      )}
    </Stack>
  );
}
