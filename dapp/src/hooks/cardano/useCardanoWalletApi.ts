import { WalletApi } from "lucid-cardano";
import { useEffect, useState } from "react";
import { useDappStore } from "../../store";

const useCardanoWalletApi = (walletKey?: string) => {
  const [walletApi, setWalletApi] = useState<WalletApi>();
  const selectWallet = useDappStore((state) => state.selectWallet);

  useEffect(() => {
    if (window.cardano && walletKey && window.cardano[walletKey]) {
      window.cardano[walletKey].enable().then(setWalletApi);
    } else {
      // the user may have uninstalled the wallet they previously had
      selectWallet(undefined);
    }
  }, [walletKey]);

  return walletApi;
};

export { useCardanoWalletApi };
