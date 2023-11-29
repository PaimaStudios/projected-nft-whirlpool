import { CardanoWalletInfo } from "../types";

export const cardanoApiMinSlot = 40000000;
export const cardanoApiMaxSlot = 2147483647;

export const cardanoWallets: CardanoWalletInfo[] = [
  {
    name: "Eternl",
    icon: "wallets/eternl.webp",
    key: "eternl",
    url: "https://eternl.io/",
  },
  {
    name: "Flint",
    icon: "wallets/flint.svg",
    key: "flint",
    url: "https://flint-wallet.com/",
  },
  {
    name: "Nami",
    icon: "wallets/nami.svg",
    key: "nami",
    url: "https://namiwallet.io/",
  },
  {
    name: "Typhon",
    icon: "wallets/typhon.svg",
    key: "typhoncip30",
    url: "https://typhonwallet.io/",
  },
];

export const nftsQueryInvalidationDelay = 1000;
