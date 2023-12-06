import { TokenEVM } from "../types";

export const areEqualTokens = (a: TokenEVM, b: TokenEVM) => {
  return a.token === b.token && a.tokenId === b.tokenId;
};
