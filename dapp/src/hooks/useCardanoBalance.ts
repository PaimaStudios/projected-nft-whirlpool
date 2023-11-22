import { Data } from "lucid-cardano";
import { useEffect, useState } from "react";

import { useCardanoWalletApi } from "./useCardanoWalletApi";
import { useDappStore } from "../store";
import { PlutusValueType, Value } from "../utils/cardano/value";

const useCardanoBalance = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Value>();

  const selectedWalletKey = useDappStore((state) => state.selectedWallet);

  const walletApi = useCardanoWalletApi(selectedWalletKey);

  useEffect(() => {
    if (walletApi) {
      walletApi.getBalance().then((balanceStr) => {
        const balance = Data.from(balanceStr) as
          | bigint
          | Array<bigint | PlutusValueType>;

        if (typeof balance === "bigint") {
          setBalance(new Value(balance));
        } else {
          if (balance.length !== 2) {
            alert({
              title: "Error",
              message: "Cannot get wallet balance",
            });
            return;
          }

          const lovelace = balance[0] as bigint;
          const assetsMap = balance[1] as PlutusValueType;

          const balanceValue = Value.fromPlutusData(assetsMap);
          balanceValue.setLovelace(lovelace || undefined);

          setBalance(balanceValue);
        }

        setLoading(false);
      });
    }
  }, [walletApi]);

  return { loading, balance };
};

export { useCardanoBalance };
