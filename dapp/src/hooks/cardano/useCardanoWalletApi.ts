import { WalletApi } from "lucid-cardano";
import { useEffect, useState } from "react";

const useCardanoWalletApi = (walletKey?: string) => {
  const [walletApi, setWalletApi] = useState<WalletApi>();

  useEffect(() => {
    if (window.cardano && walletKey && window.cardano[walletKey]) {
      window.cardano[walletKey].enable().then(setWalletApi);
    }
  }, [walletKey]);

  return walletApi;
};

export { useCardanoWalletApi };
