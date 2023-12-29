import { ProjectedNftRangeResponse, ProjectedNftStatus } from "@dcspark/carp-client/shared/models/ProjectedNftRange";
import { Token } from "./token";

export type LockInfoCardano = ProjectedNftRangeResponse[number] & {
  tokens: Token[];
  status: Exclude<ProjectedNftStatus, "Invalid">;
  unlockTime: null | bigint;
};
