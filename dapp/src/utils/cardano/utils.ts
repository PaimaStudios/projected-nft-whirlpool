import { Lovelace, Lucid } from "lucid-cardano";
import env from "../configs/env";
import { Token } from "./token";

export const formatCardanoAddress = (
  address: string | undefined,
): string | undefined => {
  if (address === undefined) return undefined;
  if (address.length < 20) {
    return address;
  }
  let firstPartEndIndex = 9;
  if (address.indexOf("test") >= 0) firstPartEndIndex += 5;
  const firstPart = address.substring(0, firstPartEndIndex);
  const lastPart = address.substring(address.length - 4, address.length);
  return `${firstPart}...${lastPart}`;
};

export const formatPolicyId = (policyId: string) => {
  return `${policyId.substring(0, 10)}...${policyId.substring(
    policyId.length - 10,
  )}`;
};

export const formatLovelace = (lovelace: Lovelace) => {
  const ada = Number(lovelace) / 1_000_000;
  return ada.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
};

export const getAddressKeyHashes = (
  lucid: Lucid,
  address: string,
): {
  paymentKeyHash: string | undefined;
  stakeKeyHash: string | undefined;
} => {
  const { paymentCredential, stakeCredential } =
    lucid.utils.getAddressDetails(address);

  return {
    paymentKeyHash: paymentCredential?.hash,
    stakeKeyHash: stakeCredential?.hash,
  };
};

/**
 * @returns Unix time of last block in milliseconds
 */
export const getLastBlockTime = async () => {
  const epochInfo = await fetch(
    env.REACT_APP_TESTNET
      ? `https://cardano-preprod.blockfrost.io/api/v0/epochs/latest`
      : `https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest`,
    {
      method: "GET",
      headers: {
        PROJECT_ID: env.REACT_APP_BLOCKFROST_PROJECT_ID,
      },
    },
  ).then((res) => res.json());
  return epochInfo.last_block_time * 1000;
};

export const processImage = (image: string) => {
  if (image.startsWith("ipfs://")) {
    const ipfsHash = image.substring("ipfs://".length);
    return `https://ipfs.io/ipfs/${ipfsHash}`;
  }
  return image;
};

export const isTokenNft = (token: Token) => {
  return token.amount <= 1n;
};

export const getCardanoWallets = () => {
  if (!window.cardano) {
    return [];
  }
  const walletKeys = Object.keys(window.cardano).filter((key) => {
    return (
      typeof window.cardano[key].apiVersion === "string" &&
      typeof window.cardano[key].icon === "string" &&
      typeof window.cardano[key].name === "string" &&
      typeof window.cardano[key].enable === "function" &&
      typeof window.cardano[key].isEnabled === "function"
    );
  });
  return walletKeys.map((key) => {
    return { ...window.cardano[key], key: key };
  });
};

export const connectWallet = async (
  wallet: ReturnType<typeof getCardanoWallets>[number],
  selectWallet: (wallet: string) => void,
) => {
  if (typeof window !== "undefined" && window.cardano) {
    try {
      const walletApi = await wallet.enable();
      if (walletApi) {
        selectWallet(wallet.key);
      }
    } catch (err: any) {
      console.error(err);
    }
  }
};
