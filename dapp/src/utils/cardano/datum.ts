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
  // TODO: replace with
  // State.new(ownerPaymentKeyHash, Status.new_locked()).to_plutus_data
  // https://github.com/dcSpark/projected-nft-whirlpool/issues/20
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
  // TODO: replace with
  // const outRef = OutRef.new(txId, outputIndex)
  // State.new(ownerPaymentKeyHash, Status.new_unlocking(UnlockingStatus.new(outRef, unlockTime))).to_plutus_data
  // https://github.com/dcSpark/projected-nft-whirlpool/issues/20
  const data = new Constr(0, [
    new Constr(0, [ownerPaymentKeyHash]),
    new Constr(1, [
      new Constr(0, [new Constr(0, [txId]), outputIndex]),
      unlockTime,
    ]),
  ]);
  return Data.to(data);
};
