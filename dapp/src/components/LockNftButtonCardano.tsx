"use client";
import { useAccount } from "wagmi";
import TransactionButton from "./TransactionButton";
import { Token } from "../utils/cardano/token";
import * as projected_nft from "projected-nft-sdk";
import { useDappStore } from "../store";
import { Value } from "../utils/cardano/value";
import { validator } from "../utils/cardano/validator";
import { Data } from "lucid-cardano";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";
import { useState } from "react";

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
    let state = projected_nft.State.new(
      projected_nft.Owner.new_keyhash(
        projected_nft.Ed25519KeyHash.from_hex(paymentKeyHash),
      ),
      projected_nft.Status.new_locked(),
    );

    let plutus_data_state = state.to_plutus_data();
    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const datum = Buffer.from(plutus_data_state.to_cbor_bytes()).toString(
      "hex",
    );
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
