"use client";
import { CircularProgress, Typography } from "@mui/material";
import TransactionButton from "./TransactionButton";
import {
  usePrepareHololockerRequestUnlock,
  usePrepareHololockerWithdraw,
} from "../generated";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import { useGetLocksEVM } from "../hooks/useGetLocksEVM";
import { LockInfo } from "../utils/types";
import Grid from "@mui/material/Unstable_Grid2";
import { hololockerConfig } from "../contracts";
import { Countdown } from "./Countdown";
import { useInterval } from "usehooks-ts";
import { useState } from "react";

function UnlockNftListItemEVM({ lockInfo }: { lockInfo: LockInfo }) {
  const { token, tokenId, unlockTime } = lockInfo;
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);

  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);

  const { config: configUnlock } = usePrepareHololockerRequestUnlock({
    address: hololockerConfig.address,
    args: [token, tokenId],
    enabled: unlockTime === 0n,
  });
  const {
    write: writeUnlock,
    data: dataUnlock,
    isLoading: isLoadingUnlock,
  } = useContractWrite(configUnlock);
  const { isLoading: isPendingUnlock } = useWaitForTransaction({
    hash: dataUnlock?.hash,
  });

  const { config: configWithdraw } = usePrepareHololockerWithdraw({
    address: hololockerConfig.address,
    args: [token, tokenId],
    enabled: unlockTime > 0n && now >= unlockTime,
  });
  const {
    write: writeWithdraw,
    data: dataWithdraw,
    isLoading: isLoadingWithdraw,
  } = useContractWrite(configWithdraw);
  const { isLoading: isPendingWithdraw } = useWaitForTransaction({
    hash: dataWithdraw?.hash,
  });

  async function unlockOrWithdrawNft() {
    if (unlockTime === 0n) {
      writeUnlock?.();
    } else {
      writeWithdraw?.();
    }
  }

  return (
    <>
      <Grid xs={7}>
        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
          {token}
        </Typography>
      </Grid>
      <Grid xs={1}>
        <Typography>{tokenId.toString()}</Typography>
      </Grid>
      <Grid xs={4} sx={{ display: "flex", justifyContent: "center" }}>
        <TransactionButton
          isLoading={isLoadingUnlock || isLoadingWithdraw}
          isPending={isPendingUnlock || isPendingWithdraw}
          onClick={unlockOrWithdrawNft}
          disabled={now < unlockTime}
          actionText={
            unlockTime === 0n ? (
              "Request Unlock"
            ) : now >= unlockTime ? (
              "Withdraw NFT"
            ) : (
              <Countdown deadline={new Date(Number(unlockTime) * 1000)} />
            )
          }
        />
      </Grid>
    </>
  );
}

export default function UnlockNftListEVM() {
  const { locks } = useGetLocksEVM();
  return locks ? (
    locks.length > 0 ? (
      <Grid container spacing={1} sx={{ alignItems: "center", width: "100%" }}>
        <Grid xs={7}>
          <Typography>Token address</Typography>
        </Grid>
        <Grid xs={1}>
          <Typography>ID</Typography>
        </Grid>
        <Grid xs={4} sx={{ display: "flex", justifyContent: "center" }}>
          <Typography>Action</Typography>
        </Grid>
        {locks.map((lock) => (
          <UnlockNftListItemEVM
            key={`${lock.token}-${lock.tokenId}`}
            lockInfo={lock}
          />
        ))}
      </Grid>
    ) : (
      <Typography>None.</Typography>
    )
  ) : (
    <CircularProgress />
  );
}
