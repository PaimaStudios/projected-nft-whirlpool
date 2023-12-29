"use client";
import { Stack, Typography } from "@mui/material";
import { useGetVmType } from "../hooks/useGetVmType";
import LockNftListEVM from "./evm/LockNftList";
import LockNftListCardano from "./cardano/LockNftList";
import { VmTypes } from "../utils/constants";
import assertNever from "assert-never";

export default function LockNftSection() {
  const vmType = useGetVmType();

  return (
    <Stack sx={{ gap: 2, mt: 4, alignItems: "center", width: "100%" }}>
      <Typography variant="h3" textAlign={"center"}>
        Project a token
      </Typography>
      {vmType === VmTypes.None ? (
        <></>
      ) : vmType === VmTypes.EVM ? (
        <LockNftListEVM />
      ) : vmType === VmTypes.Cardano ? (
        <LockNftListCardano />
      ) : (
        assertNever(vmType)
      )}
    </Stack>
  );
}
