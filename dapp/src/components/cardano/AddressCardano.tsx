import { Stack } from "@mui/material";
import { formatCardanoAddress } from "../../utils/cardano/utils";
import CopyableTypography from "../CopyableTypography";

export const AddressCardano = ({ address }: { address: string }) => {
  return (
    <Stack sx={{ flexDirection: "row" }}>
      <CopyableTypography
        textDisplay={formatCardanoAddress(address) ?? ""}
        textValue={address}
      />
    </Stack>
  );
};
