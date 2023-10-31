import { hololockerABI } from "./generated";

export const hololockerConfig = {
  address:
    process.env.REACT_APP_TESTNET === "true"
      ? "0x88101d89f6c41f075a178029A83C4e5734E0dF1B"
      : "0x",
  abi: hololockerABI,
} as const;
