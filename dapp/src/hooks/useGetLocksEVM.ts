"use client";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { hololockerConfig } from "../contracts";
import { LockInfo } from "../utils/types";

export const useGetLocksEVM = () => {
  const [locks, setLocks] = useState<LockInfo[]>();
  const [loading, setLoading] = useState<boolean>();
  const [error, setError] = useState<string>();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const fetchLocks = async (publicClient: any) => {
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
      setLocks(locks);
      setError(undefined);
    } catch (err) {
      setLocks([]);
      setError("Error occurred when fetching NFT locks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setLocks(undefined);
    fetchLocks(publicClient);
  }, [publicClient, address]);

  return { locks, loading, error };
};
