import { Blockfrost, Lucid } from "lucid-cardano";
import { useCallback, useEffect, useState } from "react";

import { useCardanoNetworkId } from "./useCardanoNetworkId";
import { useCardanoWalletApi } from "./useCardanoWalletApi";
import { useDappStore } from "../../store";
import env from "../../utils/configs/env";

const useLucid = () => {
  const selectedWallet = useDappStore((state) => state.selectedWallet);

  const walletApi = useCardanoWalletApi(selectedWallet);
  const networkId = useCardanoNetworkId(walletApi);

  const [lucid, setLucid] = useState<Lucid>();

  const createLucidInstance = useCallback(async () => {
    if (!walletApi || networkId === undefined) return;

    const blockfrostNetwork = networkId === 0 ? "Preprod" : "Mainnet";

    const provider = new Blockfrost(
      networkId === 0
        ? "https://cardano-preprod.blockfrost.io/api/v0"
        : "https://cardano-mainnet.blockfrost.io/api/v0",
      env.REACT_APP_BLOCKFROST_PROJECT_ID,
    );

    try {
      const newLucidInstance = await Lucid.new(provider, blockfrostNetwork);
      newLucidInstance.selectWallet(walletApi);

    return newLucidInstance;
    } catch (e) {
      throw new Error(`Blockfrost connection error. Check your network panel for more information`);
    }
  }, [walletApi, networkId]);

  useEffect(() => {
    createLucidInstance().then(setLucid);
  }, [walletApi, networkId, createLucidInstance]);

  return {
    networkId,
    walletApi,
    lucid,
  };
};

export { useLucid };
