import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import * as React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiConfig } from "wagmi";

import { chains, config } from "./utils/configs/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        theme={lightTheme({
          accentColor: "#19b17b",
          accentColorForeground: "EC6B67",
        })}
      >
        {mounted && children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
