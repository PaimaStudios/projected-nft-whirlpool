import { Stack } from "@mui/material";
import { formatPolicyId } from "../../utils/cardano/utils";
import CopyableTypography from "../CopyableTypography";

export const PolicyId = ({ policyId }: { policyId: string }) => {
  return (
    <Stack sx={{ flexDirection: "row" }}>
      <CopyableTypography
        textDisplay={formatPolicyId(policyId)}
        textValue={policyId}
        variant="caption"
      />
    </Stack>
  );
};
