import { hololockerABI } from "../../generated";

/**
 * Deterministic deployment address across EVM chains.
 * https://github.com/PaimaStudios/PRC/blob/main/PRCS/prc-2.md#consistent-contract-address
 */
export const hololockerConfig = {
  address: "0x963ba25745aEE135EdCFC2d992D5A939d42738B6",
  abi: hololockerABI,
} as const;
