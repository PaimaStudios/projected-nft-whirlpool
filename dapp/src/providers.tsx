import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import * as React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiConfig } from "wagmi";

import { chains, config } from "./utils/configs/wagmi";
import ModalProvider from "mui-modal-provider";
import { useLucid } from "./hooks/cardano/useLucid";
import { useDappStore } from "./store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { MaterialDesignContent } from "notistack";
import { styled } from "@mui/material";

const StyledMaterialDesignContent = styled(MaterialDesignContent)(() => ({
  "&.notistack-MuiContent-success": {
    backgroundColor: "#19b17b",
  },
  "&.notistack-MuiContent-info": {
    backgroundColor: "#121212",
  },
}));

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const { lucid } = useLucid();
  const setLucid = useDappStore((state) => state.setLucid);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    setLucid(lucid);
  }, [lucid]);
  return (
    <SnackbarProvider
      anchorOrigin={{ horizontal: "right", vertical: "top" }}
      classes={{ containerRoot: "snackbarContainer" }}
      Components={{
        success: StyledMaterialDesignContent,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={config}>
          <RainbowKitProvider
            chains={chains}
            theme={darkTheme({
              accentColor: "#19b17b",
              accentColorForeground: "EC6B67",
            })}
          >
            <ModalProvider>{mounted && children}</ModalProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </QueryClientProvider>
    </SnackbarProvider>
  );
}
