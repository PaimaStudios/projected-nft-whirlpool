"use client";
import TransactionButton from "./TransactionButton";
import { Token } from "../utils/cardano/token";
import { useDappStore } from "../store";
import { Value } from "../utils/cardano/value";
import { validator } from "../utils/cardano/validator";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";
import { useState } from "react";
import { getLockDatum } from "../utils/cardano/datum";

type Props = {
  token: Token;
};

export default function LockNftButtonCardano({ token }: Props) {
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);
  const lucid = useDappStore((state) => state.lucid);
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function lockNft() {
    console.log("lucid", lucid);
    console.log("paymentKeyHash", paymentKeyHash);
    if (!lucid || !paymentKeyHash) return;

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const datum = getLockDatum({ ownerPaymentKeyHash: paymentKeyHash });
    console.log("datum", datum);

    token.amount = 1n;
    const tx = await lucid
      .newTx()
      .payToContract(
        validatorAddress,
        { inline: datum },
        new Value(0n, [token]).toAssetsMap(),
      )
      .complete();
    setIsLoading(true);
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.NFTS],
    });
    setIsPending(false);
    return txHash;
  }

  return (
    <TransactionButton
      onClick={lockNft}
      isLoading={isLoading}
      isPending={isPending}
      actionText={"Lock NFT"}
    />
  );
}
