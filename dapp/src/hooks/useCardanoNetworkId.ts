import { WalletApi } from "lucid-cardano";
import { useEffect, useState } from "react";

const useCardanoNetworkId = (walletApi?: WalletApi) => {
  const [networkId, setNetworkId] = useState<number>();

  const onNetworkChange = (newNetworkId: unknown) => {
    setNetworkId(newNetworkId as number);
  };

  useEffect(() => {
    if (walletApi) {
      walletApi.getNetworkId().then(setNetworkId);
      if (
        walletApi.experimental &&
        walletApi.experimental.on &&
        walletApi.experimental.off
      ) {
        walletApi.experimental.on("networkChange", onNetworkChange);

        return () => {
          walletApi.experimental.off("networkChange", onNetworkChange);
        };
      }
    }
  }, [walletApi]);

  return networkId;
};

export { useCardanoNetworkId };
