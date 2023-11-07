import { hololockerABI } from "./generated";

export const hololockerConfig = {
  address:
    process.env.REACT_APP_TESTNET === "true"
      ? "0x416DcBD9e3e25a37B160f3032CddC9265A7410a2"
      : "0x",
  abi: hololockerABI,
} as const;
