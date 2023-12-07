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
import Grid from "@mui/material/Unstable_Grid2";
import { useGetNftsEVM } from "../hooks/useGetNftsEVM";
import LockNftButtonEVM from "./LockNftButtonEVM";
import { Nft } from "alchemy-sdk";
import MultilockButtonEVM from "./MultilockButtonEVM";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { TokenEVM } from "../utils/types";
import { areEqualTokens } from "../utils/evm/utils";
import MultipleSelectionLockButton from "./MultipleSelectionLockButton";

function LockNftListItemEVM({
  nft,
  displayImage,
  onClickNftCard,
  isSelected,
}: {
  nft: Nft;
  displayImage: boolean;
  onClickNftCard?: (token: TokenEVM) => void;
  isSelected: boolean;
}) {
  return (
    <Card
      sx={{ width: "100%" }}
      variant={isSelected ? "outlined" : "elevation"}
      onClick={() => {
        onClickNftCard?.({
          token: nft.contract.address as `0x${string}`,
          tokenId: BigInt(nft.tokenId),
        });
      }}
    >
      {displayImage && (
        <CardMedia
          sx={{ aspectRatio: 1, objectFit: "cover" }}
          image={nft.media[0]?.gateway ?? "/placeholder.png"}
          title={nft.title}
        />
      )}
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">{nft.title}</Typography>
          <Typography variant="body2">#{nft.tokenId}</Typography>
        </Stack>
      </CardContent>
      {!onClickNftCard && (
        <CardActions>
          <LockNftButtonEVM
            token={nft.contract.address}
            tokenId={BigInt(nft.tokenId)}
          />
        </CardActions>
      )}
    </Card>
  );
}

export default function LockNftListEVM() {
  const [selectingMultipleLock, setSelectingMultipleLock] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<TokenEVM[]>([]);
  const { data: nftsData, fetchNextPage, isFetching } = useGetNftsEVM();
  const nftGroups: Record<string, Nft[]> = {};
  nftsData?.pages.forEach((nftPage) => {
    if (!nftPage) return;
    nftPage.ownedNfts.forEach((nft) => {
      if (!nftGroups[nft.contract.address]) {
        nftGroups[nft.contract.address] = [];
      }
      nftGroups[nft.contract.address].push(nft);
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

  // When pageKey of last page is undefined, it means there is no next page.
  const allNftsLoaded =
    nftsData?.pages[nftsData.pages.length - 1]?.pageKey === undefined;

  if (!nftsData) {
    return <CircularProgress />;
  }

  if (Object.keys(nftGroups).length === 0) {
    return <Typography>None.</Typography>;
  }
  return (
    <Stack sx={{ gap: 2, width: "100%", alignItems: "center" }}>
      <MultipleSelectionLockButton
        selectedTokens={selectedTokens}
        setSelectedTokens={setSelectedTokens}
        selectingMultipleLock={selectingMultipleLock}
        setSelectingMultipleLock={setSelectingMultipleLock}
        nftGroups={nftGroups}
      />
      {Object.keys(nftGroups).map((nftContractAddress) => {
        const someTokenHasImage = !!nftGroups[nftContractAddress].find(
          (nft) => nft.media.length > 0,
        );
        return (
          <Accordion
            TransitionProps={{ unmountOnExit: true }}
            key={nftContractAddress}
            sx={{ width: "100%" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack>
                <Typography>{nftContractAddress}</Typography>
                <Typography fontWeight={600}>
                  {nftGroups[nftContractAddress][0].contract.name ?? ""}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack gap={2}>
                {nftGroups[nftContractAddress].length > 1 &&
                  !selectingMultipleLock && (
                    <>
                      <MultilockButtonEVM
                        token={nftContractAddress}
                        tokenIds={nftGroups[nftContractAddress].map((nft) =>
                          BigInt(nft.tokenId),
                        )}
                      />
                      <Typography textAlign={"center"}>
                        or lock individually
                      </Typography>
                    </>
                  )}
                <Grid container spacing={2}>
                  {nftGroups[nftContractAddress]
                    .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
                    .map((nft) => (
                      <Grid
                        xs={4}
                        key={`${nft.contract.address}-${nft.tokenId}`}
                      >
                        <LockNftListItemEVM
                          nft={nft}
                          displayImage={someTokenHasImage}
                          onClickNftCard={
                            selectingMultipleLock ? handleSelect : undefined
                          }
                          isSelected={
                            !!selectedTokens.find((token) =>
                              areEqualTokens(token, {
                                token: nft.contract.address as `0x${string}`,
                                tokenId: BigInt(nft.tokenId),
                              }),
                            )
                          }
                        />
                      </Grid>
                    ))}
                </Grid>
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
      {isFetching ? (
        <CircularProgress />
      ) : (
        !allNftsLoaded && (
          <Button onClick={() => fetchNextPage()}>Load more</Button>
        )
      )}
    </Stack>
  );
}
