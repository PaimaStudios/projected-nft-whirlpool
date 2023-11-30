"use client";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
import { getRedeemer } from "../utils/cardano/redeemer";
import { getLastBlockTime } from "../utils/cardano/utils";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";
import { getUnlockDatum } from "../utils/cardano/datum";
import { PolicyIdCardano } from "./PolicyIdCardano";
import { Token } from "../utils/cardano/token";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { nftsQueryInvalidationDelay } from "../utils/cardano/constants";
import {
  MetadataCardano,
  useGetNftsMetadataCardano,
} from "../hooks/useGetNftsMetadataCardano";

// From validator
const minimumLockTime = BigInt(300000);
const ttl = 120 * 1000;
// Artificially increase unlockTime by this amount to let chain produce block satisfying the real unlockTime
const unlockTimeReserve = BigInt(60 * 1000);

function UnlockNftCardCardano({
  token,
  metadata,
}: {
  token: Token;
  metadata?: { image?: string };
}) {
  return (
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={metadata?.image ?? "/placeholder.png"}
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
      <CardActions></CardActions>
    </Card>
  );
}

function UnlockNftListItemCardano({
  lockInfo,
  metadata,
}: {
  lockInfo: LockInfoCardano;
  metadata: MetadataCardano | null | undefined;
}) {
  const lucid = useDappStore((state) => state.lucid);
  const address = useDappStore((state) => state.address);
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);
  const { tokens } = lockInfo;
  let { unlockTime } = lockInfo;
  const [now, setNow] = useState<number>(new Date().getTime());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  if (unlockTime) {
    unlockTime += unlockTimeReserve;
  }

  useInterval(() => {
    setNow(new Date().getTime());
  }, 1000);

  async function unlockTokens() {
    setIsLoading(true);
    console.log("lockinfo", lockInfo);
    console.log("lucid", lucid);
    console.log("paymentKeyHash", paymentKeyHash);
    if (!lucid || !paymentKeyHash || !address) {
      throw new Error("Prerequisites missing!");
    }

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const utxos = await lucid.utxosByOutRef([
      {
        txHash: lockInfo.actionTxId,
        outputIndex: 0 /* TODO: lockInfo.outputIndex*/,
      },
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
      txId: lockInfo.actionTxId,
      outputIndex: BigInt(0 /* TODO: lockInfo.outputIndex*/),
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
    let signedTx;
    try {
      signedTx = await tx.sign().complete();
    } catch (err) {
      console.error(err);
      return;
    }
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

  async function withdrawTokens() {
    setIsLoading(true);
    console.log("lockinfo", lockInfo);
    console.log("lucid", lucid);
    console.log("paymentKeyHash", paymentKeyHash);
    if (!lucid || !paymentKeyHash || !address) {
      throw new Error("Prerequisites missing!");
    }

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const utxos = await lucid.utxosAt(validatorAddress);
    const inputUtxo = utxos.filter(
      (utxo) => utxo.txHash === lockInfo.actionTxId,
    )[0];
    console.log("utxos", utxos);
    console.log("inputUtxo", inputUtxo);

    if (!inputUtxo) {
      throw new Error("Input UTxO not found!");
    }

    const lastBlockTime = await getLastBlockTime();
    console.log("lastBlockTime", lastBlockTime);
    if (lastBlockTime < unlockTime!) {
      alert(
        "Latest block has not reached unlock time yet. Try again a bit later!",
      );
      return;
    }

    const tx = await lucid
      .newTx()
      .collectFrom([inputUtxo], getRedeemer({ partial_withdraw: false }))
      .attachSpendingValidator(validator)
      .addSigner(address)
      .validFrom(Number(unlockTime!))
      .complete();
    let signedTx;
    try {
      signedTx = await tx.sign().complete();
    } catch (err) {
      console.error(err);
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
  }

  async function unlockOrWithdrawTokens() {
    if (unlockTime == null) {
      await unlockTokens();
    } else {
      await withdrawTokens();
    }
    setIsLoading(false);
    setIsPending(false);
  }
  return (
    <Accordion sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack>
          <Typography>Transaction ID: {lockInfo.actionTxId}</Typography>
          <Typography fontWeight={600}>
            {lockInfo.tokens.length}{" "}
            {`token${lockInfo.tokens.length > 1 ? "s" : ""}`} (
            {lockInfo.tokens.map((token) => token.getNameUtf8()).join(", ")})
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack sx={{ gap: 2, width: "100%" }}>
          <TransactionButton
            isLoading={isLoading}
            isPending={isPending}
            onClick={unlockOrWithdrawTokens}
            disabled={unlockTime != null && now < unlockTime}
            actionText={
              unlockTime == null ? (
                `Request unlock for all locked tokens (${tokens.length}) in this UTxO`
              ) : now > unlockTime ? (
                `Withdraw all withdrawable tokens (${tokens.length}) in this UTxO`
              ) : (
                <Stack sx={{ textTransform: "none", flexDirection: "row" }}>
                  <>Unlocking in: </>
                  <Countdown deadline={new Date(Number(unlockTime))} />
                </Stack>
              )
            }
          />
          <Grid container spacing={2} sx={{ width: "100%" }}>
            {tokens.map((token) => (
              <Grid xs={3} key={token.getUnit()}>
                <UnlockNftCardCardano
                  token={token}
                  metadata={
                    metadata?.[token.asset.policyId]?.[token.asset.name]
                  }
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function UnlockNftListCardano() {
  const { data: locks } = useGetLocksCardano();
  const { data: nftMetadata } = useGetNftsMetadataCardano(
    locks?.flatMap((lock) => lock.tokens).map((token) => token.asset) ?? [],
  );

  if (!locks) {
    return <CircularProgress />;
  }
  const unclaimedLocks = locks.filter((lock) => lock.status !== "Claim");
  console.log("locks", unclaimedLocks);

  if (unclaimedLocks.length === 0) {
    return <Typography>None.</Typography>;
  }

  return (
    <Stack sx={{ gap: 2, width: "100%" }}>
      {unclaimedLocks.map((lock) => (
        <UnlockNftListItemCardano
          lockInfo={lock}
          key={lock.actionTxId}
          metadata={nftMetadata}
        />
      ))}
    </Stack>
  );
}
