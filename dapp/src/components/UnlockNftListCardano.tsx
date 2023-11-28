"use client";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import TransactionButton from "./TransactionButton";
import { LockInfoCardano } from "../utils/types";
import Grid from "@mui/material/Unstable_Grid2";
import { Countdown } from "./Countdown";
import { useInterval } from "usehooks-ts";
import { useState } from "react";
import { useGetLocksCardano } from "../hooks/useGetLocksCardano";
import { useDappStore } from "../store";
import { validator } from "../utils/cardano/validator";
import { UTxO } from "lucid-cardano";
import { getRedeemer } from "../utils/cardano/redeemer";
import { getLastBlockTime } from "../utils/cardano/utils";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";
import { getUnlockDatum } from "../utils/cardano/datum";
import { PolicyIdCardano } from "./PolicyIdCardano";

const minimumLockTime = BigInt(300000);
const ttl = 120 * 1000;

function UnlockNftCardCardano({ lockInfo }: { lockInfo: LockInfoCardano }) {
  const lucid = useDappStore((state) => state.lucid);
  const address = useDappStore((state) => state.address);
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);
  const { token, unlockTime } = lockInfo;
  const [now, setNow] = useState<number>(new Date().getTime());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  useInterval(() => {
    setNow(new Date().getTime());
  }, 1000);

  async function unlockNft() {
    setIsLoading(true);
    console.log("lockinfo", lockInfo);
    console.log("lucid", lucid);
    console.log("paymentKeyHash", paymentKeyHash);
    if (!lucid || !paymentKeyHash || !address) {
      throw new Error("Prerequisites missing!");
    }

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const utxos = await lucid.utxosByOutRef([
      { txHash: lockInfo.txId, outputIndex: lockInfo.outputIndex },
    ]);
    const inputUtxo = utxos[0];
    console.log("utxos", utxos);
    console.log("inputUtxo", inputUtxo);

    if (!inputUtxo) {
      throw new Error("Input UTxO not found!");
    }

    const lastBlockTime = await getLastBlockTime();
    console.log("lastBlockTime", lastBlockTime);

    const datum = getUnlockDatum({
      ownerPaymentKeyHash: paymentKeyHash,
      txId: lockInfo.txId,
      outputIndex: BigInt(lockInfo.outputIndex),
      unlockTime: BigInt(lastBlockTime + ttl) + minimumLockTime,
    });
    console.log("datum", datum);
    const tx = await lucid
      .newTx()
      .collectFrom([inputUtxo], getRedeemer({ partial_withdraw: false }))
      .attachSpendingValidator(validator)
      .payToContract(validatorAddress, { inline: datum }, inputUtxo.assets)
      .addSigner(address)
      .validTo(lastBlockTime + ttl)
      .complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.LOCKS],
    });
    setIsPending(false);
  }

  async function withdrawNft() {
    setIsLoading(true);
    console.log("lockinfo", lockInfo);
    console.log("lucid", lucid);
    console.log("paymentKeyHash", paymentKeyHash);
    if (!lucid || !paymentKeyHash || !address) {
      throw new Error("Prerequisites missing!");
    }

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const utxos = await lucid.utxosAt(validatorAddress);
    const inputUtxo = utxos.filter((utxo) => utxo.txHash === lockInfo.txId)[0];
    console.log("utxos", utxos);
    console.log("inputUtxo", inputUtxo);
    const inputUtxo2: UTxO = {
      address: validatorAddress,
      assets: {
        [lockInfo.token.getUnit()]: lockInfo.token.amount,
      },
      outputIndex: lockInfo.outputIndex,
      txHash: lockInfo.txId,
      datum: lockInfo.plutusDatum,
    };
    console.log("inputUtxo2", inputUtxo2);

    if (!inputUtxo) {
      throw new Error("Input UTxO not found!");
    }

    const lastBlockTime = await getLastBlockTime();
    console.log("lastBlockTime", lastBlockTime);

    const tx = await lucid
      .newTx()
      .collectFrom([inputUtxo], getRedeemer({ partial_withdraw: false }))
      .attachSpendingValidator(validator)
      .addSigner(address)
      .validFrom(lastBlockTime)
      .complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.NFTS],
    });
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.LOCKS],
    });
    setIsPending(false);
  }

  async function unlockOrWithdrawNft() {
    if (unlockTime == null) {
      unlockNft();
    } else {
      withdrawNft();
    }
  }
  return (
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={"/placeholder.png"}
        title={token.getNameUtf8()}
      />
      <CardContent>
        <Stack>
          <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="body2">{token.getNameUtf8()}</Typography>
            <Typography variant="body2">{token.amount.toString()}</Typography>
          </Stack>
          <PolicyIdCardano policyId={token.asset.policyId} />
        </Stack>
      </CardContent>
      <CardActions>
        <TransactionButton
          isLoading={isLoading}
          isPending={isPending}
          onClick={unlockOrWithdrawNft}
          disabled={unlockTime != null && now < unlockTime}
          actionText={
            unlockTime == null ? (
              "Request Unlock"
            ) : now > unlockTime ? (
              "Withdraw NFT"
            ) : (
              <Stack sx={{ textTransform: "none" }}>
                <Countdown deadline={new Date(Number(unlockTime))} />
              </Stack>
            )
          }
        />
      </CardActions>
    </Card>
  );
}

export default function UnlockNftListCardano() {
  const { data: locks } = useGetLocksCardano();

  if (!locks) {
    return <CircularProgress />;
  }
  const unclaimedLocks = locks?.filter((lock) => lock.status !== "Claim");
  console.log("locks", unclaimedLocks);

  return unclaimedLocks.length > 0 ? (
    <Grid container spacing={2} sx={{ width: "100%" }}>
      {unclaimedLocks.map((lock) => (
        <Grid xs={4} key={lock.txId}>
          <UnlockNftCardCardano lockInfo={lock} />
        </Grid>
      ))}
    </Grid>
  ) : (
    <Typography>None.</Typography>
  );
}
