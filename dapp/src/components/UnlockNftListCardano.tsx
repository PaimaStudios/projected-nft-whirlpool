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
import * as projected_nft from "projected-nft-sdk";
import { validator } from "../utils/cardano/validator";
import { Data, UTxO } from "lucid-cardano";
import { EmptyRedeemer, getRedeemer } from "../utils/cardano/redeemer";
import { getLastBlockTime } from "../utils/cardano/utils";

const minimumLockTime = BigInt(300000);
const ttl = 300000;

function UnlockNftCardCardano({ lockInfo }: { lockInfo: LockInfoCardano }) {
  const lucid = useDappStore((state) => state.lucid);
  const address = useDappStore((state) => state.address);
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);
  const { token, unlockTime } = lockInfo;
  const [now, setNow] = useState<number>(new Date().getTime());

  useInterval(() => {
    setNow(new Date().getTime());
  }, 1000);

  async function unlockNft() {
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

    let state = projected_nft.State.new(
      projected_nft.Owner.new_keyhash(
        projected_nft.Ed25519KeyHash.from_hex(paymentKeyHash),
      ),
      projected_nft.Status.new_unlocking(
        projected_nft.UnlockingStatus.new(
          projected_nft.OutRef.new(
            projected_nft.TransactionHash.from_hex(lockInfo.txId),
            BigInt(lockInfo.outputIndex),
          ),
          BigInt(lastBlockTime + ttl) + minimumLockTime,
        ),
      ),
    );
    let plutus_data_state = state.to_plutus_data();

    const datum = Buffer.from(plutus_data_state.to_cbor_bytes()).toString(
      "hex",
    );
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
    return txHash;
  }

  async function withdrawNft() {
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

    let state = projected_nft.State.new(
      projected_nft.Owner.new_keyhash(
        projected_nft.Ed25519KeyHash.from_hex(paymentKeyHash),
      ),
      projected_nft.Status.new_unlocking(
        projected_nft.UnlockingStatus.new(
          projected_nft.OutRef.new(
            projected_nft.TransactionHash.from_hex(inputUtxo.txHash),
            BigInt(inputUtxo.outputIndex),
          ),
          BigInt(lastBlockTime + ttl) + minimumLockTime,
        ),
      ),
    );
    let plutus_data_state = state.to_plutus_data();

    const datum = Buffer.from(plutus_data_state.to_cbor_bytes()).toString(
      "hex",
    );
    console.log("datum", datum);
    const tx = await lucid
      .newTx()
      .collectFrom([inputUtxo], getRedeemer({ partial_withdraw: false }))
      .attachSpendingValidator(validator)
      .addSigner(address)
      .complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    return txHash;
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
          <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>
            {token.getUnit()}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <TransactionButton
          isLoading={false}
          isPending={false}
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
