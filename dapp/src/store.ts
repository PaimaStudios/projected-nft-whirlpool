import { create } from "zustand";
import { CardanoWallets } from "./utils/types";
import { Lucid } from "lucid-cardano";

type State = {
  address: string | undefined;
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
  lucid: undefined,
  setLucid: async (lucid: Lucid | undefined) => {
    set(() => ({ lucid }));
    if (lucid) {
      const address = await lucid?.wallet.address();
      set(() => ({ address }));
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
