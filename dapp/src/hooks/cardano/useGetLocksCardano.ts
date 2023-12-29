"use client";
import { LockInfoCardano } from "../../utils/cardano/types";
import FunctionKey from "../../utils/functionKey";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDappStore } from "../../store";
import { Asset } from "../../utils/cardano/asset";
import { Token } from "../../utils/cardano/token";
import {
  cardanoApiMaxSlot,
} from "../../utils/cardano/constants";
import env from "../../utils/configs/env";
import { ProjectedNftRangeResponse, ProjectedNftStatus } from "@dcspark/carp-client/shared/models/ProjectedNftRange";
import assertNever from "assert-never";

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    // https://github.com/dcSpark/projected-nft-whirlpool/issues/21
    const request = await axios.post(
      `${env.REACT_APP_CARDANO_API_URL_BASE}/projected-nft/range`,
      // we use 0 here since in the current pagination system starting from 0 doesn't change any performance
      // compared to starting at the first slot the projected NFT system was introduced
      // and starting at 0 always makes it easier to use testnets (otherwise we'd have to optimize the minSlot for each network)
      { range: { minSlot: 0, maxSlot: cardanoApiMaxSlot } },
    );
    const responseData: ProjectedNftRangeResponse = request.data;
    const locksMap: Record<string, LockInfoCardano> = {};
    responseData.forEach((dat) => {
      if (dat.status === ProjectedNftStatus.Invalid) return;
      if (dat.ownerAddress !== paymentKeyHash) return;

      const token = new Token(new Asset(dat.policyId, dat.assetName), BigInt(dat.amount));
      const txKey = `${dat.actionTxId}#${dat.actionOutputIndex}`;
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
    });
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
