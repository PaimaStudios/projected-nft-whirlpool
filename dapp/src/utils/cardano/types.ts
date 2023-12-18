import { ProjectedNftRangeResponse } from "@dcspark/carp-client/shared/models/ProjectedNftRange";
import { Token } from "./token";

export type LockInfoCardano = ProjectedNftRangeResponse[number] & {
  tokens: Token[];
  status: "Lock" | "Unlocking" | "Claim";
  unlockTime: null | bigint;
};
