"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import {
  useErc721IsApprovedForAll,
  usePrepareErc721SetApprovalForAll,
  usePrepareHololockerLock,
} from "../generated";
import TransactionButton from "./TransactionButton";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function MultilockButtonEVM({ token, tokenIds }: Props) {
  const { address } = useAccount();

  const { data: isApproved } = useErc721IsApprovedForAll({
    address: token as `0x${string}`,
    args: [address!, hololockerConfig.address],
    enabled: !!address,
  });

  const { config: configSetApproval } = usePrepareErc721SetApprovalForAll({
    address: token as `0x${string}`,
    args: [hololockerConfig.address, true],
    enabled: !!address && !isApproved,
  });

  const { config: configHololockerLock } = usePrepareHololockerLock({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds, address!],
    enabled: !!address && !!isApproved,
  });

  const {
    write: writeSetApproval,
    data: dataSetApproval,
    isLoading: isLoadingSetApproval,
  } = useContractWrite(configSetApproval);

  const {
    write: writeHololockerLock,
    data: dataHololockerLock,
    isLoading: isLoadingHololockerLock,
  } = useContractWrite(configHololockerLock);

  const { isLoading: isPendingSetApproval } = useWaitForTransaction({
    hash: dataSetApproval?.hash,
  });

  const { isLoading: isPendingHololockerLock } = useWaitForTransaction({
    hash: dataHololockerLock?.hash,
  });

  async function setApprovalForAll() {
    if (isApproved) {
      writeHololockerLock?.();
    } else {
      writeSetApproval?.();
    }
  }

  return (
    <TransactionButton
      onClick={setApprovalForAll}
      isLoading={isLoadingSetApproval || isLoadingHololockerLock}
      isPending={isPendingSetApproval || isPendingHololockerLock}
      actionText={
        isApproved
          ? "Lock all NFTs in this collection"
          : "Approve collection for multilock"
      }
    />
  );
}
