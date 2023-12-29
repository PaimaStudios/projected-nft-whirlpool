import { Tooltip, Typography, TypographyProps } from "@mui/material";
import { useState } from "react";

type Props = TypographyProps & {
  textValue: string;
  textDisplay: string;
};

const CopyableTypography: React.FC<Props> = ({
  textValue,
  textDisplay,
  ...props
}) => {
  const [addressTooltipText, setAddressTooltipText] = useState("Copy");
  return (
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
        {...props}
        sx={{ ...props.sx, overflowWrap: "anywhere", cursor: "pointer" }}
        onClick={async () => {
          await navigator.clipboard.writeText(textValue);
          setAddressTooltipText("Copied!");
        }}
      >
        {textDisplay}
      </Typography>
    </Tooltip>
  );
};
export default CopyableTypography;
