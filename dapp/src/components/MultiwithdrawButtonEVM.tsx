"use client";
import { useAccount, useContractWrite, useWaitForTransaction } from "wagmi";
import { hololockerConfig } from "../contracts";
import { usePrepareHololockerWithdraw } from "../generated";
import TransactionButton from "./TransactionButton";

type Props = {
  token: string;
  tokenIds: bigint[];
};

export default function MultiwithdrawButtonEVM({ token, tokenIds }: Props) {
  const { address } = useAccount();

  const { config: configHololockerWithdraw } = usePrepareHololockerWithdraw({
    address: hololockerConfig.address,
    args: [Array(tokenIds.length).fill(token), tokenIds],
    enabled: !!address,
  });

  const {
    write: writeHololockerWithdraw,
    data: dataHololockerWithdraw,
    isLoading: isLoadingHololockerWithdraw,
  } = useContractWrite(configHololockerWithdraw);

  const { isLoading: isPendingHololockerWithdraw } = useWaitForTransaction({
    hash: dataHololockerWithdraw?.hash,
  });

  async function withdraw() {
    writeHololockerWithdraw?.();
  }

  return (
    <TransactionButton
      onClick={withdraw}
      isLoading={isLoadingHololockerWithdraw}
      isPending={isPendingHololockerWithdraw}
      disabled={tokenIds.length === 0}
      actionText={`Withdraw all withdrawable NFTs (${tokenIds.length}) in this collection`}
    />
  );
}
