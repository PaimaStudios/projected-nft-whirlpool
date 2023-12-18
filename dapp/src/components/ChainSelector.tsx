import { Button } from "@mui/material";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useGetVmType } from "../hooks/useGetVmType";
import { useNetwork } from "wagmi";
import { isChainSupported } from "../utils/evm/chains";
import slugify from "slugify";
import { VmTypes } from "../utils/constants";
import assertNever from "assert-never";

type Props = {
  text?: string;
};

export default function ChainSelector({ text }: Props) {
  const { openChainModal: openChainModalEVM } = useChainModal();
  const vmType = useGetVmType();
  const { chain: chainEVM } = useNetwork();

  const handleClickWhenConnected = () => {
    if (vmType === VmTypes.EVM) {
      openChainModalEVM?.();
      return;
    }
    if (vmType === VmTypes.Cardano || vmType === VmTypes.None) {
      return;
    }
    assertNever(vmType);
  };

  if (!chainEVM) {
    return <></>;
  }

  return (
    <Button onClick={handleClickWhenConnected}>
      {isChainSupported(chainEVM.id) ? (
        <img
          src={`/chains/${slugify(chainEVM.name)}.svg`}
          alt={`${chainEVM.name} network icon`}
        />
      ) : (
        text ?? (
          <img
            src={`/chains/unknown.svg`}
            alt={`${chainEVM.name} network icon`}
          />
        )
      )}
    </Button>
  );
}
