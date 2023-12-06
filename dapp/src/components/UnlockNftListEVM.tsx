"use client";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
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
import { LockInfo, TokenEVM } from "../utils/types";
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
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../utils/functionKey";
import { areEqualTokens } from "../utils/evm/utils";

// average block time on ETH
const blockTime = 12n;
// we shall wait 1.5x the average block time until we try to simulate withdraw txn
const reserveWaitingTime = (blockTime * 3n) / 2n;

function UnlockNftCardEVM({
  lockInfo,
  displayImage,
  isSelected,
  onClick,
}: {
  lockInfo: LockInfo;
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

function UnlockNftListItemEVM({
  token,
  locks,
  onClickNftCard,
  selectedTokens,
  expanded,
}: {
  token: string;
  locks: LockInfo[];
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
                  <MultirequestunlockButtonEVM
                    token={token}
                    tokenIds={tokenIdsToRequestUnlock}
                  />
                )}
                {tokenIdsToWithdraw.length > 0 && (
                  <MultiwithdrawButtonEVM
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
                  <UnlockNftCardEVM
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

export default function UnlockNftListEVM() {
  const [now, setNow] = useState<number>(new Date().getTime() / 1000);
  useInterval(() => {
    setNow(new Date().getTime() / 1000);
  }, 1000);
  const queryClient = useQueryClient();
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

  const lockGroups: Record<string, LockInfo[]> = {};
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

  const { config: configMultipleUnlock } = usePrepareHololockerRequestUnlock({
    address: hololockerConfig.address,
    args: [
      selectedTokens.map((lock) => lock.token),
      selectedTokens.map((lock) => lock.tokenId),
    ],
    enabled: selectingMultipleUnlock,
  });
  const {
    write: writeMultipleUnlock,
    data: dataMultipleUnlock,
    isLoading: isLoadingMultipleUnlock,
  } = useContractWrite(configMultipleUnlock);
  const { isLoading: isPendingMultipleUnlock } = useWaitForTransaction({
    hash: dataMultipleUnlock?.hash,
    onSuccess: () => {
      setSelectingMultipleUnlock(false);
      setSelectedTokens([]);
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
    },
  });

  const { config: configMultipleWithdraw } = usePrepareHololockerWithdraw({
    address: hololockerConfig.address,
    args: [
      selectedTokens.map((lock) => lock.token),
      selectedTokens.map((lock) => lock.tokenId),
    ],
    enabled: selectingMultipleWithdraw,
  });
  const {
    write: writeMultipleWithdraw,
    data: dataMultipleWithdraw,
    isLoading: isLoadingMultipleWithdraw,
  } = useContractWrite(configMultipleWithdraw);
  const { isLoading: isPendingMultipleWithdraw } = useWaitForTransaction({
    hash: dataMultipleWithdraw?.hash,
    onSuccess: () => {
      setSelectingMultipleWithdraw(false);
      setSelectedTokens([]);
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.LOCKS],
      });
      queryClient.invalidateQueries({
        queryKey: [FunctionKey.NFTS],
      });
    },
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

  const handleClickRequestMultipleUnlockButton = () => {
    writeMultipleUnlock?.();
  };

  const handleClickRequestMultipleWithdrawButton = () => {
    writeMultipleWithdraw?.();
  };

  if (!locks) {
    return <CircularProgress />;
  }

  if (locks.length === 0) {
    return <Typography>None.</Typography>;
  }

  return (
    <Stack sx={{ width: "100%", gap: 2 }}>
      {!selectingMultipleUnlock && !selectingMultipleWithdraw ? (
        (locksForUnlock.length > 1 || locksForWithdraw.length > 1) && (
          <>
            <Stack
              sx={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 2,
              }}
            >
              {locksForUnlock.length > 1 && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setSelectingMultipleUnlock(!selectingMultipleUnlock);
                  }}
                >
                  Select multiple tokens to unlock
                </Button>
              )}
              {locksForWithdraw.length > 1 && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    setSelectingMultipleWithdraw(!selectingMultipleWithdraw);
                  }}
                >
                  Select multiple tokens to withdraw
                </Button>
              )}
            </Stack>
            <Typography textAlign={"center"}>
              or unlock/withdraw per collections
            </Typography>
          </>
        )
      ) : (
        <Stack sx={{ gap: 2 }}>
          <Stack
            sx={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 2,
            }}
          >
            {selectingMultipleUnlock && (
              <>
                <TransactionButton
                  isLoading={isLoadingMultipleUnlock}
                  isPending={isPendingMultipleUnlock}
                  onClick={handleClickRequestMultipleUnlockButton}
                  disabled={selectedTokens.length === 0}
                  actionText={`Request unlock for selected tokens`}
                />
                <Button
                  onClick={() => {
                    setSelectingMultipleUnlock(!selectingMultipleUnlock);
                    setSelectedTokens([]);
                  }}
                  disabled={isLoadingMultipleUnlock || isPendingMultipleUnlock}
                >
                  Cancel
                </Button>
              </>
            )}
            {selectingMultipleWithdraw && (
              <>
                <TransactionButton
                  isLoading={isLoadingMultipleWithdraw}
                  isPending={isPendingMultipleWithdraw}
                  onClick={handleClickRequestMultipleWithdrawButton}
                  disabled={selectedTokens.length === 0}
                  actionText={`Withdraw selected tokens`}
                />
                <Button
                  onClick={() => {
                    setSelectingMultipleWithdraw(!selectingMultipleWithdraw);
                    setSelectedTokens([]);
                  }}
                  disabled={
                    isLoadingMultipleWithdraw || isPendingMultipleWithdraw
                  }
                >
                  Cancel
                </Button>
              </>
            )}
          </Stack>

          <Typography textAlign={"center"}>
            Click token cards to select/deselect
          </Typography>
        </Stack>
      )}
      {Object.keys(lockGroups).map((token) => (
        <UnlockNftListItemEVM
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
