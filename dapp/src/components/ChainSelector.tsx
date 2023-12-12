import { Button } from "@mui/material";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useGetChainType } from "../hooks/useGetChainType";
import { useNetwork } from "wagmi";
import { isChainSupported } from "../utils/evm/chains";
import slugify from "slugify";

type Props = {
  text?: string;
};

export default function ChainSelector({ text }: Props) {
  const { openChainModal: openChainModalEVM } = useChainModal();
  const chainType = useGetChainType();
  const { chain: chainEVM } = useNetwork();

  const handleClickWhenConnected = () => {
    if (chainType === "EVM") {
      openChainModalEVM?.();
    }
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
