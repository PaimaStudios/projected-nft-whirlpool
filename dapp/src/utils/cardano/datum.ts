import { Constr, Data } from "lucid-cardano";

// Check hololocker.ak for datum definitions

/**
 * State { owner: Owner::PKH(address), status: Status::Locked }
 */
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

/**
 * State { owner, Unlocking { out_ref, for_how_long } }
 */
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
