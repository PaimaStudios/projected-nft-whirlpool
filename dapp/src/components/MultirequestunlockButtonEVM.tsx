"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import { usePrepareHololockerRequestUnlock } from "../generated";
import TransactionButton from "./TransactionButton";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function MultirequestunlockButtonEVM({
  token,
  tokenIds,
}: Props) {
  const { address } = useAccount();

  const { config: configHololockerUnlock } = usePrepareHololockerRequestUnlock({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds],
    enabled: !!address,
  });

  const {
    write: writeHololockerUnlock,
    data: dataHololockerUnlock,
    isLoading: isLoadingHololockerUnlock,
  } = useContractWrite(configHololockerUnlock);

  const { isLoading: isPendingHololockerUnlock } = useWaitForTransaction({
    hash: dataHololockerUnlock?.hash,
  });

  async function requestUnlock() {
    writeHololockerUnlock?.();
  }

  return (
    <TransactionButton
      onClick={requestUnlock}
      isLoading={isLoadingHololockerUnlock}
      isPending={isPendingHololockerUnlock}
      disabled={tokenIds.length === 0}
      actionText={`Request unlock for all locked NFTs (${tokenIds.length}) in this collection`}
    />
  );
}
