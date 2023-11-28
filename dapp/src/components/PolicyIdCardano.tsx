import { Stack, Tooltip, Typography } from "@mui/material";
import { formatPolicyId } from "../utils/cardano/utils";
import { useState } from "react";

export const PolicyIdCardano = ({ policyId }: { policyId: string }) => {
  const [policyIdTooltipText, setPolicyIdTooltipText] = useState("Copy");
  return (
    <Stack sx={{ flexDirection: "row" }}>
      <Tooltip
        title={policyIdTooltipText}
        placement="top"
        PopperProps={{
          sx: { pointerEvents: "none" },
          popperOptions: {
            modifiers: [{ name: "offset", options: { offset: [0, -12] } }],
          },
        }}
        onPointerLeave={() => {
          setTimeout(() => {
            setPolicyIdTooltipText("Copy");
          }, 500);
        }}
      >
        <Typography
          variant="caption"
          sx={{ overflowWrap: "anywhere", cursor: "pointer" }}
          onClick={async () => {
            await navigator.clipboard.writeText(policyId);
            setPolicyIdTooltipText("Copied!");
          }}
        >
          {formatPolicyId(policyId)}
        </Typography>
      </Tooltip>
    </Stack>
  );
};
