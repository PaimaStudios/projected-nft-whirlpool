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
import TransactionButton from "../TransactionButton";
import {
  usePrepareHololockerRequestUnlock,
  usePrepareHololockerWithdraw,
} from "../../generated";
import { useContractWrite, useWaitForTransaction } from "wagmi";
import { useGetLocksEVM } from "../../hooks/evm/useGetLocksEVM";
import { LockInfoEVM, TokenEVM } from "../../utils/evm/types";
import Grid from "@mui/material/Unstable_Grid2";
import { hololockerConfig } from "../../contracts";
import { Countdown } from "../Countdown";
import { useInterval } from "usehooks-ts";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useGetNftsMetadataEVM } from "../../hooks/evm/useGetNftsMetadataEVM";
import { NftTokenType } from "alchemy-sdk";
import CollectionUnlockButton from "./CollectionUnlockButton";
import CollectionWithdrawButton from "./CollectionWithdrawButton";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { areEqualTokens } from "../../utils/evm/utils";
import MultipleSelectionUnlockButton from "./MultipleSelectionUnlockButton";
import MultipleSelectionWithdrawButton from "./MultipleSelectionWithdrawButton";

// average block time on ETH
const blockTime = 12n;
// we shall wait 1.5x the average block time until we try to simulate withdraw txn
const reserveWaitingTime = (blockTime * 3n) / 2n;

function UnlockNftCard({
  lockInfo,
  displayImage,
  isSelected,
  onClick,
}: {
  lockInfo: LockInfoEVM;
  displayImage: boolean;
  isSelected: boolean;
  onClick?: (token: TokenEVM) => void;
}) {
  const { token, tokenId, nftData } = lockInfo;
  let { unlockTime } = lockInfo;
  if (unlockTime > 0n) {
    unlockTime += reserveWaitingTime;
  }
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

  async function unlockOrWithdrawNft() {
    if (unlockTime === 0n) {
      writeUnlock?.();
    } else {
      writeWithdraw?.();
    }
  }
  return (
    <Card
      sx={{ width: "100%" }}
      variant={isSelected ? "outlined" : "elevation"}
      onClick={() => {
        onClick?.(lockInfo);
      }}
    >
      {displayImage && (
        <CardMedia
          sx={{ aspectRatio: 1, objectFit: "cover" }}
          image={nftData?.media[0]?.gateway ?? "/placeholder.png"}
          title={nftData?.title}
        />
      )}
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">{nftData?.title}</Typography>
          <Typography variant="body2">#{tokenId.toString()}</Typography>
        </Stack>
      </CardContent>
      {!onClick && (
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
                "Withdraw"
              ) : (
                <Stack sx={{ textTransform: "none" }}>
                  <Countdown deadline={new Date(Number(unlockTime) * 1000)} />
                </Stack>
              )
            }
          />
        </CardActions>
      )}
    </Card>
  );
}

function UnlockNftListItem({
  token,
  locks,
  onClickNftCard,
  selectedTokens,
  expanded,
}: {
  token: string;
  locks: LockInfoEVM[];
  onClickNftCard?: (token: TokenEVM) => void;
  selectedTokens: TokenEVM[];
  expanded: boolean;
}) {
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);
  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);
  const [accordionExpanded, setAccordionExpanded] = useState(expanded);

  const tokenIdsToRequestUnlock = locks
    .filter((lock) => lock.unlockTime === 0n)
    .map((lock) => lock.tokenId);

  const tokenIdsToWithdraw = locks
    .filter(
      (lock) =>
        lock.unlockTime !== 0n && now > lock.unlockTime + reserveWaitingTime,
    )
    .map((lock) => lock.tokenId);

  const someTokenHasImage = !!locks.find((lock) => {
    const media = lock.nftData?.media;
    return media && media.length > 0;
  });

  return (
    <Accordion
      TransitionProps={{ unmountOnExit: true }}
      sx={{ width: "100%" }}
      expanded={accordionExpanded}
      onChange={() => {
        setAccordionExpanded(!accordionExpanded);
      }}
    >
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
          {locks.length > 1 && !onClickNftCard && (
            <>
              <Stack
                sx={{
                  flexDirection: "row",
                  gap: 2,
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {tokenIdsToRequestUnlock.length > 0 && (
                  <CollectionUnlockButton
                    token={token}
                    tokenIds={tokenIdsToRequestUnlock}
                  />
                )}
                {tokenIdsToWithdraw.length > 0 && (
                  <CollectionWithdrawButton
                    token={token}
                    tokenIds={tokenIdsToWithdraw}
                  />
                )}
              </Stack>
              {(tokenIdsToRequestUnlock.length > 0 ||
                tokenIdsToWithdraw.length > 0) && (
                <Typography textAlign={"center"}>
                  or unlock/withdraw individually
                </Typography>
              )}
            </>
          )}

          <Grid container spacing={2}>
            {locks
              .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
              .map((lock) => (
                <Grid xs={4} key={`${token}-${lock.tokenId}`}>
                  <UnlockNftCard
                    key={`${lock.token}-${lock.tokenId}`}
                    lockInfo={lock}
                    displayImage={someTokenHasImage}
                    isSelected={
                      !!selectedTokens.find((token) =>
                        areEqualTokens(token, lock),
                      )
                    }
                    onClick={onClickNftCard}
                  />
                </Grid>
              ))}
          </Grid>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function UnlockNftList() {
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);
  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);
  const [selectingMultipleUnlock, setSelectingMultipleUnlock] = useState(false);
  const [selectingMultipleWithdraw, setSelectingMultipleWithdraw] =
    useState(false);
  const [selectedTokens, setSelectedTokens] = useState<TokenEVM[]>([]);
  let { data: locks } = useGetLocksEVM();
  const { data: nftsMetadata } = useGetNftsMetadataEVM(
    locks?.map((lock) => {
      return {
        contractAddress: lock.token,
        tokenId: lock.tokenId.toString(),
        tokenType: NftTokenType.ERC721,
      };
    }) ?? [],
  );

  const locksForUnlock = locks?.filter((lock) => lock.unlockTime === 0n) ?? [];
  const locksForWithdraw =
    locks?.filter(
      (lock) =>
        lock.unlockTime > 0n && now > lock.unlockTime + reserveWaitingTime,
    ) ?? [];
  if (locks) {
    if (selectingMultipleUnlock) {
      locks = locksForUnlock;
    } else if (selectingMultipleWithdraw) {
      locks = locksForWithdraw;
    }
  }

  const lockGroups: Record<string, LockInfoEVM[]> = {};
  locks?.forEach((lock) => {
    if (!lockGroups[lock.token]) {
      lockGroups[lock.token] = [];
    }
    lockGroups[lock.token].push({
      ...lock,
      nftData: nftsMetadata?.find(
        (nft) =>
          nft.contract.address.toLowerCase() === lock.token.toLowerCase() &&
          BigInt(nft.tokenId) === lock.tokenId,
      ),
    });
  });

  const handleSelect = (token: TokenEVM) => {
    const foundToken = selectedTokens.find((x) => areEqualTokens(x, token));
    if (foundToken) {
      setSelectedTokens(
        selectedTokens.filter((selectedLock) => selectedLock !== foundToken),
      );
    } else {
      setSelectedTokens(selectedTokens.concat(token));
    }
  };

  if (!locks) {
    return <CircularProgress />;
  }

  if (locks.length === 0) {
    return <Typography>None.</Typography>;
  }

  return (
    <Stack sx={{ width: "100%", gap: 2, alignItems: "center" }}>
      <Stack
        sx={{
          flexDirection: "row",
          width: "100%",
          gap: 2,
          justifyContent: "center",
        }}
        component={"section"}
      >
        {locksForUnlock.length > 1 && !selectingMultipleWithdraw && (
          <MultipleSelectionUnlockButton
            selectedTokens={selectedTokens}
            setSelectedTokens={setSelectedTokens}
            selectingMultipleUnlock={selectingMultipleUnlock}
            setSelectingMultipleUnlock={setSelectingMultipleUnlock}
          />
        )}
        {locksForWithdraw.length > 1 && !selectingMultipleUnlock && (
          <MultipleSelectionWithdrawButton
            selectedTokens={selectedTokens}
            setSelectedTokens={setSelectedTokens}
            selectingMultipleWithdraw={selectingMultipleWithdraw}
            setSelectingMultipleWithdraw={setSelectingMultipleWithdraw}
          />
        )}
      </Stack>
      {(locksForUnlock.length > 1 || locksForWithdraw.length > 1) &&
        !selectingMultipleUnlock &&
        !selectingMultipleWithdraw && (
          <Typography textAlign={"center"}>
            or unlock/withdraw per collections
          </Typography>
        )}
      {Object.keys(lockGroups).map((token) => (
        <UnlockNftListItem
          token={token}
          locks={lockGroups[token]}
          key={token}
          onClickNftCard={
            selectingMultipleUnlock || selectingMultipleWithdraw
              ? handleSelect
              : undefined
          }
          selectedTokens={selectedTokens}
          expanded={!!lockGroups[token].find((lock) => lock.unlockTime !== 0n)}
        />
      ))}
    </Stack>
  );
}
