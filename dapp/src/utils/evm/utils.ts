import { TokenEVM } from "../types";

export const areEqualTokens = (a: TokenEVM, b: TokenEVM) => {
  return a.token === b.token && a.tokenId === b.tokenId;
};

export const formatEVMAddress = (
  address: string | undefined,
): string | undefined => {
  if (address === undefined) return undefined;
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4,
  )}`;
};
