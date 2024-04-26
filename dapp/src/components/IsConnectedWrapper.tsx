import { Stack, Typography } from "@mui/material";
import { PropsWithChildren } from "react";
import ConnectWallet from "./ConnectWallet";
import { useGetVmType } from "../hooks/useGetVmType";
import { isChainSupported as isEvmChainSupported } from "../utils/evm/chains";
import { isChainSupported as isCardanoChainSupported } from "../utils/cardano/chains";
import { useNetwork } from "wagmi";
import ChainSelector from "./ChainSelector";
import { VmTypes } from "../utils/constants";
import { useCardanoNetworkId } from "../hooks/cardano/useCardanoNetworkId";
import { useCardanoWalletApi } from "../hooks/cardano/useCardanoWalletApi";
import { useDappStore } from "../store";

export default function IsConnectedWrapper({ children }: PropsWithChildren) {
  const vmType = useGetVmType();

  if (vmType === VmTypes.None) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center", textAlign: "center" }}>
        <Typography>
          Connect your wallet to get started with using the Projected NFT
          Whirlpool dApp
        </Typography>
        <ConnectWallet
          popoverAnchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          popoverTransformOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        />
      </Stack>
    );
  }

  if (vmType === VmTypes.EVM) {
    const EvmIsConnected = IsConnectedEvmWrapper();
    if (EvmIsConnected != null) {
      return EvmIsConnected;
    }
  }
  if (vmType === VmTypes.Cardano) {
    const CardanoIsConnected = IsConnectedCardanoWrapper();
    if (CardanoIsConnected != null) {
      return CardanoIsConnected;
    }
  }
  
  return <>{children}</>;
}

function IsConnectedCardanoWrapper() {
  const selectedWallet = useDappStore((state) => state.selectedWallet);
  const walletApi = useCardanoWalletApi(selectedWallet);
  const networkId = useCardanoNetworkId(walletApi);
  const supportedChain = isCardanoChainSupported(networkId);

  if (!supportedChain) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center" }}>
        <Typography>You are using an account on an unsupported network.</Typography>
      </Stack>
    );
  }

  return undefined;
}

function IsConnectedEvmWrapper() {
  const { chain } = useNetwork();
  const supportedChain = isEvmChainSupported(chain?.id);

  if (!supportedChain) {
    return (
      <Stack sx={{ my: 4, gap: 2, alignItems: "center" }}>
        <Typography>You are using an unsupported network.</Typography>
        <ChainSelector text="Switch network" />
      </Stack>
    );
  }

  return undefined;
}