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
import { nftsQueryInvalidationDelay } from "../utils/cardano/constants";
import { ButtonProps } from "@mui/material";

type Props = {
  tokens: Token[];
  actionText?: string;
} & ButtonProps;

export default function LockNftButtonCardano({
  tokens,
  actionText = "Lock token",
  ...props
}: Props) {
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

    // todo Remove after testing
    tokens = tokens.map((token) => {
      return new Token(token.asset, 1n);
    });

    const tx = await lucid
      .newTx()
      .payToContract(
        validatorAddress,
        { inline: datum },
        new Value(0n, tokens).toAssetsMap(),
      )
      .complete();
    setIsLoading(true);
    let signedTx;
    try {
      signedTx = await tx.sign().complete();
    } catch (err) {
      console.error(err);
      setIsLoading(false);
      return;
    }
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
    }, nftsQueryInvalidationDelay);
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.LOCKS],
    });
    setIsPending(false);
    return txHash;
  }

  async function handleClickLockButton() {
    try {
      await lockNft();
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.info || err.message}`);
    }
    setIsLoading(false);
    setIsPending(false);
  }

  return (
    <TransactionButton
      onClick={handleClickLockButton}
      isLoading={isLoading}
      isPending={isPending}
      actionText={actionText}
      {...props}
    />
  );
}
