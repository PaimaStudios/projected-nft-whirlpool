import { hololockerABI } from "./generated";

export const hololockerConfig = {
  address:
    process.env.REACT_APP_TESTNET === "true"
      ? "0x963ba25745aEE135EdCFC2d992D5A939d42738B6"
      : "0x",
  abi: hololockerABI,
} as const;
