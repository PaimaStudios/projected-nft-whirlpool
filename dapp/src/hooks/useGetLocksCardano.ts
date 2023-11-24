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
  '[{"txId":"b18cde014f4bafdbdadd722be0b3df635280b0681dc60757368de6cc463c17be","outputIndex":0,"slot":43201687,"asset":"f1b6a862e8a73fa2ae074cf9e0f9f1de4acf52f122c39bf54bca83c3.4c6f636b2054657374204e465420313030353030","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c66e7ab739435e31d3c4c4197d6cc08c1ee5be7309e14242a07b03541ffd87980ff"},{"txId":"9e3ca49babe0efeb76ef87eb7ba75e9e840f1ee49746aa1cd7322b0614f43a2a","outputIndex":0,"slot":43201777,"asset":"f1b6a862e8a73fa2ae074cf9e0f9f1de4acf52f122c39bf54bca83c3.4c6f636b2054657374204e465420313030353030","amount":"1","status":"Unlocking","plutusDatum":"d8799fd8799f581c66e7ab739435e31d3c4c4197d6cc08c1ee5be7309e14242a07b03541ffd87a9fd8799fd8799f5820b18cde014f4bafdbdadd722be0b3df635280b0681dc60757368de6cc463c17beff00ff1b0000018b8d754dc8ffff"},{"txId":"274b51ba6977a8d13e08254deed5fa1be7a4cd6e1fb1419fe03caba5762b00f6","outputIndex":0,"slot":43205720,"asset":"f1b6a862e8a73fa2ae074cf9e0f9f1de4acf52f122c39bf54bca83c3.4c6f636b2054657374204e465420313030353030","amount":"1","status":"Lock","plutusDatum":"d8799fd87a9f581ce8695b87ed398f16c02634f74b132b39e544e5993e09d722cfd31ea5554c6f636b2054657374204e465420436f6e74726f6cffd87980ff"},{"txId":"f3ce70e77a4a5f40520b9de67613d9aa572114b901d5c4aa69876794c4eba9e2","outputIndex":0,"slot":43205750,"asset":"f1b6a862e8a73fa2ae074cf9e0f9f1de4acf52f122c39bf54bca83c3.4c6f636b2054657374204e465420313030353030","amount":"1","status":"Unlocking","plutusDatum":"d8799fd87a9f581ce8695b87ed398f16c02634f74b132b39e544e5993e09d722cfd31ea5554c6f636b2054657374204e465420436f6e74726f6cffd87a9fd8799fd8799f5820274b51ba6977a8d13e08254deed5fa1be7a4cd6e1fb1419fe03caba5762b00f6ff00ff1b0000018b8db1fcf0ffff"},{"txId":"0523cc39b51e82cc912dc0c07950d366397814e79e33a42d82f8e992a9e935e5","outputIndex":0,"slot":45054769,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e35","amount":"1","status":"Lock","plutusDatum":"d8799fd87a9f581ce11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e4c6f636b2054657374204e4654ffd87980ff"},{"txId":"c601a1c39b1857e8710c9201e793a38319c7230f3cb6b69ff4ddc119b89d851b","outputIndex":0,"slot":45067463,"asset":"70abf0df92dde285bda393e1c3fe134b700cab2aa9ca750e9a5d2daa.5445535432","amount":"1","status":"Lock","plutusDatum":"d8799fd87a9f581c70abf0df92dde285bda393e1c3fe134b700cab2aa9ca750e9a5d2daa4c6f636b2054657374204e4654ffd87980ff"},{"txId":"b6f259864f9bf122d5a0bd8baef31cab3fe51da053e243059bf2477a0d69bb58","outputIndex":0,"slot":45068469,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e33","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87980ff"}]',
) as ProjectedNftCardanoEventsResponse;

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    // const request = await axios.post(
    //   `${process.env.REACT_APP_CARDANO_API_URL_BASE}/api/v1/shinkai/identities?page`,
    // );
    // const responseData: ProjectedNftCardanoEventsResponse = request.data;
    const locksMap: Record<string, LockInfoCardano> = {};
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
      if (!decoded) {
        console.error(`Could not decode datum of tx ${dat.txId}`);
        return;
      }
      if (decoded.owner !== paymentKeyHash) {
        return;
      }

      const lock = {
        ...dat,
        token: new Token(new Asset(dat.asset), BigInt(dat.amount)),
        status: dat.status,
        ...decoded,
      };

      switch (dat.status) {
        case "Lock":
          locksMap[dat.txId] = lock;
          break;
        case "Unlocking":
          if (!decoded.outRef) {
            console.error(
              "Unexpected error occured: Unlocking tx does not have outRef",
              lock,
            );
            break;
          }
          delete locksMap[decoded.outRef.hash];
          locksMap[dat.txId] = lock;
          break;
        case "Claim":
          if (!decoded.outRef) {
            console.error(
              "Unexpected error occured: Claim tx does not have outRef",
              lock,
            );
            break;
          }
          delete locksMap[decoded.outRef.hash];
          break;
      }
    });
    const locks: LockInfoCardano[] = Object.values(locksMap).sort(
      (a, b) => a.slot - b.slot,
    );
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
