import { create } from "zustand";
import { CardanoWallets } from "./utils/cardano/types";
import { Lucid } from "lucid-cardano";
import { getAddressKeyHashes } from "./utils/cardano/utils";

type State = {
  address: string | undefined;
  paymentKeyHash: string | undefined;
  lucid: Lucid | undefined;
  selectedWallet: CardanoWallets | undefined;
};

type Actions = {
  setLucid: (lucid: Lucid | undefined) => Promise<void>;
  selectWallet: (wallet: CardanoWallets | undefined) => void;
};

export const selectedWalletLocalStorageKey = "selectedWallet";

export const useDappStore = create<State & Actions>((set) => ({
  address: undefined,
  paymentKeyHash: undefined,
  lucid: undefined,
  setLucid: async (lucid: Lucid | undefined) => {
    set(() => ({ lucid }));
    if (lucid) {
      const address = await lucid?.wallet.address();
      const paymentKeyHash = getAddressKeyHashes(lucid, address).paymentKeyHash;
      set(() => ({
        address,
        paymentKeyHash,
      }));
    }
  },
  selectedWallet:
    (localStorage.getItem(selectedWalletLocalStorageKey) as CardanoWallets) ||
    undefined,
  selectWallet: (wallet: CardanoWallets | undefined) => {
    set(() => ({ selectedWallet: wallet }));
    if (wallet === undefined) {
      localStorage.removeItem(selectedWalletLocalStorageKey);
    } else {
      localStorage.setItem(selectedWalletLocalStorageKey, wallet);
    }
  },
}));
