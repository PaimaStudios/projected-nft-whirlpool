"use client";
import {
  LockInfoCardano,
  ProjectedNftCardanoEventsResponse,
} from "../../utils/cardano/types";
import FunctionKey from "../../utils/functionKey";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useDappStore } from "../../store";
import { Asset } from "../../utils/cardano/asset";
import { Token } from "../../utils/cardano/token";
import {
  cardanoApiMaxSlot,
  cardanoApiMinSlot,
} from "../../utils/cardano/constants";
import env from "../../utils/configs/env";

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    const request = await axios.post(
      `${env.REACT_APP_CARDANO_API_URL_BASE}/projected-nft/range`,
      { range: { minSlot: cardanoApiMinSlot, maxSlot: cardanoApiMaxSlot } },
    );
    const responseData: ProjectedNftCardanoEventsResponse = request.data;
    const locksMap: Record<string, LockInfoCardano> = {};
    responseData.forEach((dat) => {
      if (dat.status === "Invalid") return;
      if (dat.ownerAddress !== paymentKeyHash) return;

      const token = new Token(new Asset(dat.asset), BigInt(dat.amount));
      const txKey = `${dat.actionTxId}#${dat.actionOutputIndex}`;
      const previousTxKey =
        dat.previousTxHash !== "" && dat.previousTxOutputIndex != null
          ? `${dat.previousTxHash}#${dat.previousTxOutputIndex}`
          : null;

      switch (dat.status) {
        case "Lock":
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
        case "Unlocking":
          if (!previousTxKey) {
            console.error(
              "Unexpected error occured: Unlocking tx does not have previousTxHash",
              dat,
            );
            break;
          }
          if (!dat.forHowLong) {
            console.error(
              "Unexpected error occured: Unlocking tx does not have unlockTime",
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
        case "Claim":
          if (!previousTxKey) {
            console.error(
              "Unexpected error occured: Claim tx does not have previousTxHash",
              dat,
            );
            break;
          }
          delete locksMap[previousTxKey];
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

/*
const decodeDatumLock = (data: Constr<any>) => {
  if (data.fields.length !== 2) return undefined;
  return {
    owner: data.fields[0].fields[0] as string,
    outRef: null,
    unlockTime: null,
  };
};

const decodeDatumUnlocking = (data: Constr<any>) => {
  if (data.fields.length !== 2) return undefined;
  return {
    owner: data.fields[0].fields[0] as string,
    outRef: {
      hash: data.fields[1].fields[0].fields[0].fields[0] as string,
      index: data.fields[1].fields[0].fields[1] as bigint,
    },
    unlockTime: data.fields[1].fields[1] as bigint,
  };
};
*/

export const useGetLocksCardano = () => {
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);

  return useQuery({
    queryKey: [FunctionKey.LOCKS, { paymentKeyHash }],
    queryFn: () => fetchLocks(paymentKeyHash!),
    enabled: !!paymentKeyHash,
  });
};
