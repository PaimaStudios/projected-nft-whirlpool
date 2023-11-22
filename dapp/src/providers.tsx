import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import * as React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiConfig } from "wagmi";

import { chains, config } from "./utils/configs/wagmi";
import ModalProvider from "mui-modal-provider";
import { useLucid } from "./hooks/useLucid";
import { useDappStore } from "./store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const { lucid } = useLucid();
  const setLucid = useDappStore((state) => state.setLucid);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    setLucid(lucid);
  }, [lucid]);
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider
        chains={chains}
        theme={lightTheme({
          accentColor: "#19b17b",
          accentColorForeground: "EC6B67",
        })}
      >
        <ModalProvider>{mounted && children}</ModalProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
