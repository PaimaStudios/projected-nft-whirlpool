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
import {
  cardanoApiMaxSlot,
  cardanoApiMinSlot,
} from "../utils/cardano/constants";

// const responseData = JSON.parse(
//   '[{"txId":"eb6a78fa3bd91d083cb44dbc22d7f89aa7ab4cda1d9d01a589ba3a369823d822","outputIndex":0,"slot":45150841,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e34","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87980ff"},{"txId":"cf7d583b8dc43dd44658d81756bda57da1da9757ee33daf6e8a024a626434aef","outputIndex":0,"slot":45152024,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e34","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87980ff"},{"txId":"1c10f80ccc28f654ebcb9367ae1dcce669469074a4a22ccfef8839b9d9a32a54","outputIndex":0,"slot":45152755,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e34","amount":"1","status":"Unlocking","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87a9fd8799fd8799f5820eb6a78fa3bd91d083cb44dbc22d7f89aa7ab4cda1d9d01a589ba3a369823d822ff00ff1b0000018c01c05498ffff"},{"txId":"d8e13ee6528d74897278357885b6d307ff651d8415324c1016b5ccc90663704e","outputIndex":0,"slot":45153969,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e34","amount":"1","status":"Unlocking","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87a9fd8799fd8799f5820cf7d583b8dc43dd44658d81756bda57da1da9757ee33daf6e8a024a626434aefff00ff1b0000018c01d2a030ffff"},{"txId":"6be7884a8958a9dab3826f760e411aaf7daca5a7c12566224cf683b5fe78e552","outputIndex":0,"slot":45393483,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e33","amount":"1","status":"Lock","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87980ff"},{"txId":"5d64117ce11d7fb0b0ed823b4d7195c36d9464d8811171b86f26effe3a685ec9","outputIndex":0,"slot":45393767,"asset":"e11f5bf5d6c13587ff8bb4aa7585f94c5d8b752745d27ebbc32e1d2e.544f4b454e33","amount":"1","status":"Unlocking","plutusDatum":"d8799fd8799f581c9040f057461d9adc09108fe5cb630077cf75c6e981d3ed91f6fb18f6ffd87a9fd8799fd8799f58206be7884a8958a9dab3826f760e411aaf7daca5a7c12566224cf683b5fe78e552ff00ff1b0000018c101cd048ffff"}]',
// ) as ProjectedNftCardanoEventsResponse;

const fetchLocks = async (paymentKeyHash: string) => {
  try {
    const request = await axios.post(
      `${process.env.REACT_APP_CARDANO_API_URL_BASE}/projected-nft/range`,
      { range: { minSlot: cardanoApiMinSlot, maxSlot: cardanoApiMaxSlot } },
    );
    const responseData: ProjectedNftCardanoEventsResponse = request.data;
    const locksMap: Record<string, LockInfoCardano> = {};
    console.log("fetching locks for", paymentKeyHash);
    console.log("response", responseData);
    responseData.forEach((dat) => {
      console.log(dat);
      if (dat.status === "Invalid") return;
      let decoded:
        | ReturnType<typeof decodeDatumLock>
        | ReturnType<typeof decodeDatumUnlocking> = undefined;
      if (dat.plutusDatum !== "") {
        const datum = Data.from(dat.plutusDatum) as Constr<any>;
        console.log("datum", datum);
        decoded =
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
      }

      const token = new Token(new Asset(dat.asset), BigInt(dat.amount));

      switch (dat.status) {
        case "Lock":
          if (!locksMap[dat.txId]) {
            const lock: LockInfoCardano = {
              ...dat,
              tokens: [token],
              status: dat.status,
              ...decoded!,
            };
            locksMap[dat.txId] = lock;
          } else {
            locksMap[dat.txId].tokens.push(token);
          }
          break;
        case "Unlocking":
          if (!decoded || !decoded.outRef) {
            console.error(
              "Unexpected error occured: Unlocking tx does not have outRef",
              dat,
            );
            break;
          }
          if (!locksMap[decoded.outRef.hash]) {
            break;
          }
          const lock: LockInfoCardano = {
            ...locksMap[decoded.outRef.hash],
            ...dat,
            status: dat.status,
            ...decoded!,
          };
          delete locksMap[decoded.outRef.hash];
          locksMap[dat.txId] = lock;
          break;
        case "Claim":
          // if (!dat.previousRef) {
          //   console.error(
          //     "Unexpected error occured: Claim tx does not have previousRef",
          //     dat,
          //   );
          //   break;
          // }
          // delete locksMap[dat.previousRef];
          break;
      }
    });
    console.log("locksMap", locksMap);
    const locks: LockInfoCardano[] = Object.values(locksMap).sort(
      (a, b) => a.slot - b.slot,
    );
    return locks;
  } catch (err) {
    console.error(err);
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
