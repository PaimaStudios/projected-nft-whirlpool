import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";

const walletConnectProjectId = "2ad63f343ccc9226126483eca27e8810";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [process.env.REACT_APP_TESTNET === "true" ? sepolia : mainnet],
  [
    alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY ?? "" }),
    publicProvider(),
  ],
);

const { connectors } = getDefaultWallets({
  appName: "Projected NFT Whirlpool",
  chains,
  projectId: walletConnectProjectId,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
