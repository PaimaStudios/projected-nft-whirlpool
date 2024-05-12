"use client";
import { LockInfoCardano } from "../../utils/cardano/types";
import FunctionKey from "../../utils/functionKey";
import { useQuery } from "@tanstack/react-query";
import { useDappStore } from "../../store";
import { Asset } from "../../utils/cardano/asset";
import { Token } from "../../utils/cardano/token";
import env from "../../utils/configs/env";
import assertNever from "assert-never";
import { ProjectedNftStatus, Routes, paginatedProjectedNft, query } from "@dcspark/carp-client";

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    const latest = await query(env.REACT_APP_CARDANO_API_URL_BASE, Routes.blockLatest, {
      offset: 0,
    });
    const request = await paginatedProjectedNft(
      env.REACT_APP_CARDANO_API_URL_BASE,
      {
        address: paymentKeyHash,
        untilBlock: latest.block.hash,
      }
    );
    const locksMap: Record<string, LockInfoCardano> = {};
    request.forEach(datAndTx => datAndTx.payload.forEach((dat) => {
      if (dat.status === ProjectedNftStatus.Invalid) return;
      if (dat.ownerAddress !== paymentKeyHash) return;

      const token = new Token(new Asset(dat.policyId, dat.assetName), BigInt(dat.amount));
      const txKey = `${datAndTx.txId}#${dat.actionOutputIndex}`;
      const previousTxKey =
        dat.previousTxHash !== "" && dat.previousTxOutputIndex != null
          ? `${dat.previousTxHash}#${dat.previousTxOutputIndex}`
          : null;

      switch (dat.status) {
        case ProjectedNftStatus.Lock:
          if (!locksMap[txKey]) {
            const lock: LockInfoCardano = {
              ...dat,
              tokens: [token],
              status: dat.status,
              unlockTime: null,
              block: datAndTx.block,
              txId: datAndTx.txId,
            };
            locksMap[txKey] = lock;
          } else {
            locksMap[txKey].tokens.push(token);
          }
          break;
        case ProjectedNftStatus.Unlocking:
          if (!previousTxKey) {
            console.error(
              "Unexpected error occurred: Unlocking tx does not have previousTxHash",
              dat,
            );
            break;
          }
          if (!dat.forHowLong) {
            console.error(
              "Unexpected error occurred: Unlocking tx does not have unlockTime",
              dat,
            );
            break;
          }
          if (!locksMap[txKey]) {
            const lock: LockInfoCardano = {
              ...dat,
              tokens: [token],
              status: dat.status,
              unlockTime: BigInt(dat.forHowLong),
              block: datAndTx.block,
              txId: datAndTx.txId,
            };
            delete locksMap[previousTxKey];
            locksMap[txKey] = lock;
          } else {
            locksMap[txKey].tokens.push(token);
          }
          break;
        case ProjectedNftStatus.Claim:
          if (!previousTxKey) {
            console.error(
              "Unexpected error occurred: Claim tx does not have previousTxHash",
              dat,
            );
            break;
          }
          delete locksMap[previousTxKey];
          break;
        default:
          assertNever(dat.status);
          break;
      }
    }));
    const locks: LockInfoCardano[] = Object.values(locksMap).sort(
      (a, b) => a.actionSlot - b.actionSlot,
    );
    return locks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const useGetLocksCardano = () => {
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);

  return useQuery({
    queryKey: [FunctionKey.LOCKS, { paymentKeyHash }],
    queryFn: () => fetchLocks(paymentKeyHash!),
    enabled: !!paymentKeyHash,
  });
};
