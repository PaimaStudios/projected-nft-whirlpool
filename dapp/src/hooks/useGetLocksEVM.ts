"use client";
import { useAccount, usePublicClient } from "wagmi";
import { hololockerConfig } from "../contracts";
import { LockInfo } from "../utils/types";
import FunctionKey from "../utils/functionKey";
import { useQuery } from "@tanstack/react-query";

const fetchLocks = async (publicClient: any, address: string | undefined) => {
  if (address === undefined) {
    return null;
  }
  try {
    const separator = "-";
    const lockLogs = await publicClient.getContractEvents({
      ...hololockerConfig,
      fromBlock: 0n,
      eventName: "Lock",
      args: {
        owner: address,
      },
    });
    const lockedNftsMap: Record<
      string,
      { blockNumber: bigint; unlockTime: bigint }
    > = {};
    lockLogs.forEach((log: any) => {
      const key = `${
        log.args.token
      }${separator}${log.args.tokenId?.toString()}`;
      if (
        !lockedNftsMap[key] ||
        lockedNftsMap[key].blockNumber < log.blockNumber
      ) {
        lockedNftsMap[key] = { blockNumber: log.blockNumber, unlockTime: 0n };
      }
    });

    const withdrawLogs = await publicClient.getContractEvents({
      ...hololockerConfig,
      fromBlock: 0n,
      eventName: "Withdraw",
      args: {
        owner: address,
      },
    });
    withdrawLogs.forEach((log: any) => {
      const key = `${
        log.args.token
      }${separator}${log.args.tokenId?.toString()}`;
      if (lockedNftsMap[key].blockNumber < log.blockNumber) {
        delete lockedNftsMap[key];
      }
    });

    const unlockLogs = await publicClient.getContractEvents({
      ...hololockerConfig,
      fromBlock: 0n,
      eventName: "Unlock",
      args: {
        owner: address,
      },
    });
    unlockLogs.forEach((log: any) => {
      const key = `${
        log.args.token
      }${separator}${log.args.tokenId?.toString()}`;
      if (
        lockedNftsMap[key] &&
        lockedNftsMap[key].blockNumber < log.blockNumber
      ) {
        lockedNftsMap[key] = {
          blockNumber: log.blockNumber,
          unlockTime: log.args.unlockTime!,
        };
      }
    });

    const locks: LockInfo[] = Object.keys(lockedNftsMap).map((key) => {
      return {
        token: key.substring(0, key.indexOf("-")) as `0x${string}`,
        tokenId: BigInt(key.substring(key.indexOf("-") + 1)),
        unlockTime: lockedNftsMap[key].unlockTime,
      };
    });
    return locks;
  } catch (err) {
    return [];
  }
};

export const useGetLocksEVM = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: [FunctionKey.LOCKS, { address, publicClient }],
    queryFn: () => fetchLocks(publicClient, address),
  });
};
