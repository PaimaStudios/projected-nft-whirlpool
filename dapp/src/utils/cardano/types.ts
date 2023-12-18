import { Token } from "./token";

type ProjectedNftCardanoEventsResponseObject = {
  actionSlot: number;
  actionTxId: string;
  amount: string;
  asset: string;
  actionOutputIndex: number | null;
  forHowLong: number | null;
  ownerAddress: string;
  plutusDatum: string;
  previousTxHash: string;
  previousTxOutputIndex: number | null;
  status: "Lock" | "Unlocking" | "Claim" | "Invalid";
};

export type ProjectedNftCardanoEventsResponse =
  ProjectedNftCardanoEventsResponseObject[];

export type LockInfoCardano = ProjectedNftCardanoEventsResponseObject & {
  tokens: Token[];
  status: "Lock" | "Unlocking" | "Claim";
  unlockTime: null | bigint;
};

export type MetadataNftCardano = {
  [policyId: string]: {
    [assetName: string]: string;
  };
};

export type MetadataNftCardanoResponse = {
  cip25: MetadataNftCardano;
};
