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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useGetNftsMetadataEVM } from "../hooks/useGetNftsMetadataEVM";
import { NftTokenType } from "alchemy-sdk";
import MultirequestunlockButtonEVM from "./MultirequestunlockButtonEVM";
import MultiwithdrawButtonEVM from "./MultiwithdrawButtonEVM";

const blockTimeSeconds = 12n + 1n;

function UnlockNftCardEVM({ lockInfo }: { lockInfo: LockInfo }) {
  const { token, tokenId, nftData } = lockInfo;
  let { unlockTime } = lockInfo;
  if (unlockTime > 0n) {
    unlockTime += blockTimeSeconds;
  }
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);

  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);

  const { config: configUnlock } = usePrepareHololockerRequestUnlock({
    address: hololockerConfig.address,
    args: [[token], [tokenId]],
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
    args: [[token], [tokenId]],
    enabled: unlockTime > 0n && now > unlockTime,
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
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={nftData?.media[0]?.gateway ?? "/placeholder.png"}
        title={nftData?.title}
      />
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">{nftData?.title}</Typography>
          <Typography variant="body2">#{tokenId.toString()}</Typography>
        </Stack>
      </CardContent>
      <CardActions>
        <TransactionButton
          isLoading={isLoadingUnlock || isLoadingWithdraw}
          isPending={isPendingUnlock || isPendingWithdraw}
          onClick={unlockOrWithdrawNft}
          disabled={now < unlockTime}
          actionText={
            unlockTime === 0n ? (
              "Request Unlock"
            ) : now > unlockTime ? (
              "Withdraw NFT"
            ) : (
              <Countdown deadline={new Date(Number(unlockTime) * 1000)} />
            )
          }
        />
      </CardActions>
    </Card>
  );
}

function UnlockNftListItemEVM({
  token,
  locks,
}: {
  token: string;
  locks: LockInfo[];
}) {
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);
  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);

  const tokenIdsToRequestUnlock = locks
    .filter((lock) => lock.unlockTime === 0n)
    .map((lock) => lock.tokenId);

  const tokenIdsToWithdraw = locks
    .filter(
      (lock) =>
        lock.unlockTime !== 0n && now > lock.unlockTime + blockTimeSeconds,
    )
    .map((lock) => lock.tokenId);

  return (
    <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack>
          <Typography>{token}</Typography>
          <Typography fontWeight={600}>
            {locks[0].nftData?.contract.name ?? ""}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack gap={2}>
          <MultirequestunlockButtonEVM
            token={token}
            tokenIds={tokenIdsToRequestUnlock}
          />
          <MultiwithdrawButtonEVM token={token} tokenIds={tokenIdsToWithdraw} />
          <Typography textAlign={"center"}>
            or unlock/withdraw individually
          </Typography>
          <Grid container spacing={2}>
            {locks
              .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
              .map((lock) => (
                <Grid xs={4} key={`${token}-${lock.tokenId}`}>
                  <UnlockNftCardEVM
                    key={`${lock.token}-${lock.tokenId}`}
                    lockInfo={lock}
                  />
                </Grid>
              ))}
          </Grid>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function UnlockNftListEVM() {
  const { locks } = useGetLocksEVM();
  const nftsMetadata = useGetNftsMetadataEVM(
    locks?.map((lock) => {
      return {
        contractAddress: lock.token,
        tokenId: lock.tokenId.toString(),
        tokenType: NftTokenType.ERC721,
      };
    }) ?? [],
  );
  const lockGroups: Record<string, LockInfo[]> = {};
  locks?.forEach((lock, index) => {
    if (!lockGroups[lock.token]) {
      lockGroups[lock.token] = [];
    }
    lockGroups[lock.token].push({ ...lock, nftData: nftsMetadata?.[index] });
  });

  return locks ? (
    locks.length > 0 ? (
      <>
        {Object.keys(lockGroups).map((token) => (
          <UnlockNftListItemEVM
            token={token}
            locks={lockGroups[token]}
            key={token}
          />
        ))}
      </>
    ) : (
      <Typography>None.</Typography>
    )
  ) : (
    <CircularProgress />
  );
}
