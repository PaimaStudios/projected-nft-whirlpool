import { Data, WalletApi } from "lucid-cardano";
import { useEffect, useState } from "react";

import { useCardanoWalletApi } from "./useCardanoWalletApi";
import { useDappStore } from "../../store";
import { PlutusValueType, Value } from "../../utils/cardano/value";
import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";

const fetchBalance = async (walletApi: WalletApi) => {
  const balanceStr = await walletApi.getBalance();
  const balance = Data.from(balanceStr) as
    | bigint
    | Array<bigint | PlutusValueType>;

  if (typeof balance === "bigint") {
    return new Value(balance);
  }
  if (balance.length !== 2) {
    alert({
      title: "Error",
      message: "Cannot get wallet balance",
    });
    return null;
  }

  const lovelace = balance[0] as bigint;
  const assetsMap = balance[1] as PlutusValueType;

  const balanceValue = Value.fromPlutusData(assetsMap);
  balanceValue.setLovelace(lovelace || undefined);

  return balanceValue;
};

const useCardanoBalance = () => {
  const selectedWalletKey = useDappStore((state) => state.selectedWallet);
  const walletApi = useCardanoWalletApi(selectedWalletKey);

  return useQuery({
    queryKey: [FunctionKey.NFTS, { walletApi }],
    queryFn: () => fetchBalance(walletApi!),
    enabled: !!walletApi,
  });
};

export { useCardanoBalance };
