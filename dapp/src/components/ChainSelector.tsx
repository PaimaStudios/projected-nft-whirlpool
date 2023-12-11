import { Button } from "@mui/material";
import { useChainModal } from "@rainbow-me/rainbowkit";
import { useGetChainType } from "../hooks/useGetChainType";
import { useNetwork } from "wagmi";
import { isChainSupported } from "../utils/evm/chains";

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

  if (chainType !== "EVM") {
    return <></>;
  }
  const chainName =
    text ??
    (isChainSupported(chainEVM?.id) ? chainEVM?.name : "Unsupported network");
  return <Button onClick={handleClickWhenConnected}>{chainName}</Button>;
}
