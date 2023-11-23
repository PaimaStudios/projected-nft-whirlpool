"use client";
import {
  LockInfoCardano,
  ProjectedNftCardanoEventsResponse,
} from "../utils/types";
import FunctionKey from "../utils/functionKey";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Constr, Data } from "lucid-cardano";
import { useDappStore } from "../store";
import { Asset } from "../utils/cardano/asset";
import { Token } from "../utils/cardano/token";

const responseData = JSON.parse(
  '[{"txId":"0523cc39b51e82cc912dc0c07950d366397814e79e33a42d82f8e992a9e935e5","outputIndex":0,"slot":45054769,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e35","amount":"1","status":"Lock","plutusDatum":"d8799fd87a9f581ce11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e4c6f636b2054657374204e4654ffd87980ff"},{"txId":"c601a1c39b1857e8710c9201e793a38319c7230f3cb6b69ff4ddc119b89d851b","outputIndex":0,"slot":45067463,"asset":"70abf0df92dde285bda393e1c3fe134b700cab2aa9ca750e9a5d2daa.5445535432","amount":"1","status":"Lock","plutusDatum":"d8799fd87a9f581c70abf0df92dde285bda393e1c3fe134b700cab2aa9ca750e9a5d2daa4c6f636b2054657374204e4654ffd87980ff"},{"txId":"b6f259864f9bf122d5a0bd8baef31cab3fe51da053e243059bf2477a0d69bb58","outputIndex":0,"slot":45068469,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e33","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87980ff"}]',
) as ProjectedNftCardanoEventsResponse;

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    // const request = await axios.post(
    //   `${process.env.REACT_APP_CARDANO_API_URL_BASE}/api/v1/shinkai/identities?page`,
    // );
    // const responseData: ProjectedNftCardanoEventsResponse = request.data;
    const locks: LockInfoCardano[] = [];
    console.log("fetching locks for", paymentKeyHash);
    responseData.forEach((dat) => {
      console.log(dat);
      if (dat.status === "Invalid") return;
      const datum = Data.from(dat.plutusDatum) as Constr<any>;
      console.log("datum", datum);
      const decoded =
        dat.status === "Lock"
          ? decodeDatumLock(datum)
          : decodeDatumUnlocking(datum);
      console.log("decoded", decoded);
      if (decoded?.owner === paymentKeyHash) {
        locks.push({
          ...dat,
          token: new Token(new Asset(dat.asset), BigInt(dat.amount)),
          status: dat.status,
          ...decoded,
        });
      }
    });
    return locks;
  } catch (err) {
    return [];
  }
};

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

export const useGetLocksCardano = () => {
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);

  return useQuery({
    queryKey: [FunctionKey.LOCKS, { paymentKeyHash }],
    queryFn: () => fetchLocks(paymentKeyHash!),
    enabled: !!paymentKeyHash,
  });
};
