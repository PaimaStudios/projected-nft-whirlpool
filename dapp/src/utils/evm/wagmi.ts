import { getDefaultWallets } from "@rainbow-me/rainbowkit";
import { configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";
import env from "../configs/env";
import { supportedChains } from "./chains";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  supportedChains,
  [
    alchemyProvider({ apiKey: env.REACT_APP_ALCHEMY_ETHEREUM_API_KEY }),
    alchemyProvider({ apiKey: env.REACT_APP_ALCHEMY_ARBITRUM_API_KEY }),
    publicProvider(),
  ],
);

const { connectors } = getDefaultWallets({
  appName: "Projected NFT Whirlpool",
  chains,
  projectId: env.REACT_APP_WALLET_CONNECT_PROJECT_ID,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
