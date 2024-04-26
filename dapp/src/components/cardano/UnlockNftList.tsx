"use client";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import TransactionButton from "../TransactionButton";
import { LockInfoCardano } from "../../utils/cardano/types";
import Grid from "@mui/material/Unstable_Grid2";
import { Countdown } from "../Countdown";
import { useInterval } from "usehooks-ts";
import { useState } from "react";
import { useGetLocksCardano } from "../../hooks/cardano/useGetLocksCardano";
import { useDappStore } from "../../store";
import { validator } from "../../utils/cardano/validator";
import { getRedeemer } from "../../utils/cardano/redeemer";
import { getLastBlockTime } from "../../utils/cardano/utils";
import { useQueryClient } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { getUnlockDatum } from "../../utils/cardano/datum";
import { PolicyId } from "./PolicyId";
import { Token } from "../../utils/cardano/token";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { nftsQueryInvalidationDelay } from "../../utils/cardano/constants";
import {
  MetadataCardano,
  useGetNftsMetadataCardano,
} from "../../hooks/cardano/useGetNftsMetadataCardano";
import { Value } from "../../utils/cardano/value";
import { useSnackbar } from "notistack";
import { SnackbarMessage } from "../../utils/texts";

// From validator (hololocker.ah)
// TODO: get this from WASM instead (https://github.com/dcSpark/projected-nft-whirlpool/issues/22)
const minimumLockTime = BigInt(300000);
const ttl = 120 * 1000;
// Artificially increase unlockTime by this amount to let chain produce block satisfying the real unlockTime
const unlockTimeReserve = BigInt(60 * 1000);

function UnlockNftCard({
  token,
  metadata,
  isSelected,
  onClick,
  displayImage,
}: {
  token: Token;
  metadata?: { image?: string };
  isSelected: boolean;
  onClick: () => void;
  displayImage: boolean;
}) {
  return (
    <Card
      sx={{ width: "100%" }}
      variant={isSelected ? "outlined" : "elevation"}
      onClick={onClick}
    >
      {displayImage && (
        <CardMedia
          sx={{ aspectRatio: 1, objectFit: "cover" }}
          image={metadata?.image ?? "/placeholder.png"}
          title={token.getNameUtf8()}
        />
      )}
      <CardContent>
        <Stack>
          <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="body2">{token.getNameUtf8()}</Typography>
            <Typography variant="body2">{token.amount.toString()}</Typography>
          </Stack>
          <PolicyId policyId={token.asset.policyId} />
        </Stack>
      </CardContent>
      <Stack />
    </Card>
  );
}

function UnlockNftListItem({
  lockInfo,
  metadata,
}: {
  lockInfo: LockInfoCardano;
  metadata: MetadataCardano | null | undefined;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const lucid = useDappStore((state) => state.lucid);
  const address = useDappStore((state) => state.address);
  const paymentKeyHash = useDappStore((state) => state.paymentKeyHash);
  const { tokens, actionOutputIndex, txId, plutusDatum } = lockInfo;
  let { unlockTime } = lockInfo;
  const [now, setNow] = useState<number>(new Date().getTime());
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectMultiple, setSelectMultiple] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const queryClient = useQueryClient();

  if (unlockTime) {
    unlockTime += unlockTimeReserve;
  }

  useInterval(() => {
    setNow(new Date().getTime());
  }, 1000);

  const handleSelect = (token: Token) => {
    if (selectedTokens.includes(token)) {
      setSelectedTokens(
        selectedTokens.filter((selectedToken) => selectedToken !== token),
      );
    } else {
      setSelectedTokens(selectedTokens.concat(token));
    }
  };

  async function unlockTokens(partialWithdrawTokens?: Token[]) {
    setIsLoading(true);
    if (!lucid || !paymentKeyHash || !address || actionOutputIndex == null) {
      throw new Error("Prerequisites missing!");
    }

    if (!txId) {
      console.error("txId missing in lock info", lockInfo);
      return;
    }
    if (!plutusDatum) {
      console.error("plutusDatum missing in lock info", lockInfo);
      return;
    }

    const validatorAddress = lucid.utils.validatorToAddress(validator);
    const utxos = await lucid.utxosByOutRef([
      {
        txHash: txId,
        outputIndex: actionOutputIndex,
      },
    ]);
    const inputUtxo = utxos[0];

    if (!inputUtxo) {
      throw new Error("Input UTxO not found!");
    }

    const lastBlockTime = await getLastBlockTime();

    const datum = getUnlockDatum({
      ownerPaymentKeyHash: paymentKeyHash,
      txId,
      outputIndex: BigInt(actionOutputIndex),
      unlockTime: BigInt(lastBlockTime + ttl) + minimumLockTime,
    });
    const valueToUnlock = new Value(
      inputUtxo.assets["lovelace"],
      partialWithdrawTokens ?? tokens,
    );
    const assetsToUnlock = valueToUnlock.toAssetsMap();
    const valueToLeaveBe = new Value(
      0n,
      tokens.filter((token) => !partialWithdrawTokens?.includes(token)),
    );
    const assetsToLeaveBe = valueToLeaveBe.toAssetsMap();
    let tx = lucid
      .newTx()
      .collectFrom(
        [inputUtxo],
        getRedeemer({ partial_withdraw: !!partialWithdrawTokens }),
      )
      .attachSpendingValidator(validator)
      .payToContract(validatorAddress, { inline: datum }, assetsToUnlock)
      .addSigner(address)
      .validTo(lastBlockTime + ttl);
    if (partialWithdrawTokens) {
      tx = tx.payToContract(
        validatorAddress,
        { inline: plutusDatum },
        assetsToLeaveBe,
      );
    }
    const txComplete = await tx.complete();
    let signedTx;
    try {
      signedTx = await txComplete.sign().complete();
    } catch (err) {
      console.error(err);
      return;
    }
    const txHash = await signedTx.submit();
    console.log("txhash", txHash);
    enqueueSnackbar({
      message: SnackbarMessage.TransactionSubmitted,
      variant: "info",
    });
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    enqueueSnackbar({
      message: SnackbarMessage.UnlockSuccess,
      variant: "success",
    });
    queryClient.invalidateQueries({
      queryKey: [FunctionKey.LOCKS],
    });
    setIsPending(false);
  }

  async function withdrawTokens() {
    setIsLoading(true);
    if (!lucid || !paymentKeyHash || !address || actionOutputIndex == null) {
      throw new Error("Prerequisites missing!");
    }

    if (!txId) {
      console.error("txId missing in lock info", lockInfo);
      return;
    }

    const utxos = await lucid.utxosByOutRef([
      {
        txHash: txId,
        outputIndex: actionOutputIndex,
      },
    ]);
    const inputUtxo = utxos[0];

    if (!inputUtxo) {
      throw new Error("Input UTxO not found!");
    }

    const lastBlockTime = await getLastBlockTime();
    if (lastBlockTime < unlockTime!) {
      enqueueSnackbar({
        message: SnackbarMessage.BlockDidNotReachUnlockTime,
        variant: "warning",
      });
      return;
    }

    const tx = await lucid
      .newTx()
      .collectFrom([inputUtxo], getRedeemer({ partial_withdraw: !!tokens }))
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
    enqueueSnackbar({
      message: SnackbarMessage.TransactionSubmitted,
      variant: "info",
    });
    setIsLoading(false);
    setIsPending(true);
    await lucid.awaitTx(txHash);
    enqueueSnackbar({
      message: SnackbarMessage.WithdrawSuccess,
      variant: "success",
    });
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

  async function handleClickUnlockOrWithdrawAll() {
    try {
      if (unlockTime == null) {
        await unlockTokens();
      } else {
        await withdrawTokens();
      }
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar({
        message: `Error: ${err.info || err.message}`,
        variant: "error",
      });
    }
    setIsLoading(false);
    setIsPending(false);
  }

  async function handleClickRequestPartialUnlockButton() {
    try {
      await unlockTokens(selectedTokens);
    } catch (err: any) {
      console.error(err);
      enqueueSnackbar({
        message: `Error: ${err.info || err.message}`,
        variant: "error",
      });
    }
    setIsLoading(false);
    setIsPending(false);
  }

  const someTokenHasMetadata = !!tokens.find(
    (token) => metadata?.[token.asset.policyId]?.[token.asset.name],
  );

  return (
    <Accordion
      sx={{ width: "100%" }}
      defaultExpanded={lockInfo.unlockTime != null}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack>
          <Typography sx={{ overflowWrap: "anywhere" }}>
            Tx ID: {txId}
            <Box component="span" fontWeight={700}>
              #{actionOutputIndex}
            </Box>
          </Typography>
          <Typography fontWeight={600}>
            {tokens.length} {`token${tokens.length > 1 ? "s" : ""}`} (
            {tokens.map((token) => token.getNameUtf8()).join(", ")})
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack sx={{ gap: 2, width: "100%" }}>
          {unlockTime == null &&
            tokens.length > 1 &&
            (selectMultiple ? (
              <Stack sx={{ gap: 2 }}>
                <Stack
                  sx={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 2,
                  }}
                >
                  <TransactionButton
                    isLoading={isLoading}
                    isPending={isPending}
                    onClick={handleClickRequestPartialUnlockButton}
                    disabled={selectedTokens.length === 0}
                    actionText={`Request unlock for selected tokens`}
                  />
                  <Button
                    onClick={() => {
                      setSelectMultiple(!selectMultiple);
                      setSelectedTokens([]);
                    }}
                    disabled={isLoading || isPending}
                  >
                    Cancel
                  </Button>
                </Stack>
                {!isLoading && !isPending && (
                  <Typography textAlign={"center"}>
                    Click token cards to select/deselect
                  </Typography>
                )}
              </Stack>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  setSelectMultiple(!selectMultiple);
                }}
                disabled={isLoading || isPending}
              >
                Request partial unlock
              </Button>
            ))}
          {!selectMultiple && (
            <TransactionButton
              isLoading={isLoading}
              isPending={isPending}
              onClick={handleClickUnlockOrWithdrawAll}
              disabled={unlockTime != null && now < unlockTime}
              actionText={
                unlockTime == null ? (
                  `Request unlock for all tokens in this UTxO`
                ) : now > unlockTime ? (
                  `Withdraw all tokens in this UTxO`
                ) : (
                  <Stack sx={{ textTransform: "none", flexDirection: "row" }}>
                    <>Unlocking in: </>
                    <Countdown deadline={new Date(Number(unlockTime))} />
                  </Stack>
                )
              }
            />
          )}
          <Grid container spacing={2} sx={{ width: "100%" }}>
            {tokens.map((token) => (
              <Grid xs={6} sm={4} md={3} key={token.getUnit()}>
                <UnlockNftCard
                  token={token}
                  metadata={
                    metadata?.[token.asset.policyId]?.[token.asset.name]
                  }
                  isSelected={selectedTokens.includes(token)}
                  onClick={() => {
                    if (selectMultiple) handleSelect(token);
                  }}
                  displayImage={someTokenHasMetadata}
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
  const { data: locks } = useGetLocksCardano();
  const { data: nftMetadata } = useGetNftsMetadataCardano(
    locks?.flatMap((lock) => lock.tokens).map((token) => token.asset) ?? [],
  );

  if (!locks) {
    return <CircularProgress />;
  }
  const unclaimedLocks = locks.filter((lock) => lock.status !== "Claim");

  if (unclaimedLocks.length === 0) {
    return <Typography>None.</Typography>;
  }

  return (
    <Stack sx={{ gap: 2, width: "100%" }}>
      {unclaimedLocks.map((lock) => (
        <UnlockNftListItem
          lockInfo={lock}
          key={`${lock.txId}#${lock.actionOutputIndex}`}
          metadata={nftMetadata}
        />
      ))}
    </Stack>
  );
}
