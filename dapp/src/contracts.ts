import { hololockerABI } from "./generated";
import env from "./utils/configs/env";

export const hololockerConfig = {
  address: env.REACT_APP_TESTNET
    ? "0x963ba25745aEE135EdCFC2d992D5A939d42738B6"
    : "0x",
  abi: hololockerABI,
} as const;
