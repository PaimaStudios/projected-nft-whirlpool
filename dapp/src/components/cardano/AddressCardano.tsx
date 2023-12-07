import { Stack, Tooltip, Typography } from "@mui/material";
import { formatCardanoAddress } from "../../utils/cardano/utils";
import { useState } from "react";

export const AddressCardano = ({ address }: { address: string }) => {
  const [addressTooltipText, setAddressTooltipText] = useState("Copy");
  return (
    <Stack sx={{ flexDirection: "row" }}>
      <Tooltip
        title={addressTooltipText}
        placement="top"
        PopperProps={{
          sx: { pointerEvents: "none" },
          popperOptions: {
            modifiers: [{ name: "offset", options: { offset: [0, -12] } }],
          },
        }}
        onPointerLeave={() => {
          setTimeout(() => {
            setAddressTooltipText("Copy");
          }, 500);
        }}
      >
        <Typography
          sx={{ overflowWrap: "anywhere", cursor: "pointer" }}
          onClick={async () => {
            await navigator.clipboard.writeText(address);
            setAddressTooltipText("Copied!");
          }}
        >
          {formatCardanoAddress(address)}
        </Typography>
      </Tooltip>
    </Stack>
  );
};
