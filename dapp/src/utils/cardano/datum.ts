import { Constr, Data } from "lucid-cardano";

export const getLockDatum = ({
  ownerPaymentKeyHash,
}: {
  ownerPaymentKeyHash: string;
}): string => {
  const data = new Constr(0, [
    new Constr(0, [ownerPaymentKeyHash]),
    new Constr(0, []),
  ]);
  return Data.to(data);
};

export const getUnlockDatum = ({
  ownerPaymentKeyHash,
  txId,
  outputIndex,
  unlockTime,
}: {
  ownerPaymentKeyHash: string;
  txId: string;
  outputIndex: bigint;
  unlockTime: bigint;
}): string => {
  const data = new Constr(0, [
    new Constr(0, [ownerPaymentKeyHash]),
    new Constr(1, [
      new Constr(0, [new Constr(0, [txId]), outputIndex]),
      unlockTime,
    ]),
  ]);
  return Data.to(data);
};
