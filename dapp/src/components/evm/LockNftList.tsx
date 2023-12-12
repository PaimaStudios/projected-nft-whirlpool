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
import { useGetNftsEVM } from "../../hooks/evm/useGetNftsEVM";
import LockNftButton from "./LockNftButton";
import { Nft } from "alchemy-sdk";
import CollectionLockButton from "./CollectionLockButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import { TokenEVM } from "../../utils/evm/types";
import { areEqualTokens, formatEVMAddress } from "../../utils/evm/utils";
import MultipleSelectionLockButton from "./MultipleSelectionLockButton";
import CopyableTypography from "../CopyableTypography";

function LockNftCard({
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
          <LockNftButton
            token={nft.contract.address}
            tokenId={BigInt(nft.tokenId)}
          />
        </CardActions>
      )}
    </Card>
  );
}

function LockNftListItem({
  nfts,
  nftContractAddress,
  selectingMultipleLock,
  selectedTokens,
  onClickNftCard,
}: {
  nfts: Nft[];
  nftContractAddress: string;
  selectingMultipleLock: boolean;
  selectedTokens: TokenEVM[];
  onClickNftCard?: (token: TokenEVM) => void;
}) {
  const someTokenHasImage = !!nfts.find((nft) => nft.media.length > 0);
  return (
    <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ width: "100%" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack>
          <CopyableTypography
            textDisplay={formatEVMAddress(nftContractAddress) ?? ""}
            textValue={nftContractAddress}
          />
          <Typography fontWeight={600}>
            {nfts[0].contract.name ?? ""}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack gap={2}>
          {nfts.length > 1 && !selectingMultipleLock && (
            <>
              <CollectionLockButton
                token={nftContractAddress}
                tokenIds={nfts.map((nft) => BigInt(nft.tokenId))}
              />
              <Typography textAlign={"center"}>or lock individually</Typography>
            </>
          )}
          <Grid container spacing={2}>
            {nfts
              .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
              .map((nft) => (
                <Grid
                  xs={6}
                  sm={4}
                  md={3}
                  key={`${nft.contract.address}-${nft.tokenId}`}
                >
                  <LockNftCard
                    nft={nft}
                    displayImage={someTokenHasImage}
                    onClickNftCard={
                      selectingMultipleLock ? onClickNftCard : undefined
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
}

export default function LockNftList() {
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
  const tokens = Object.values(nftGroups)
    .flat()
    .map((nft) => {
      return {
        token: nft.contract.address as `0x${string}`,
        tokenId: BigInt(nft.tokenId),
      };
    });
  return (
    <Stack sx={{ gap: 2, width: "100%", alignItems: "center" }}>
      {(nftsData.pages[0]?.ownedNfts.length ?? 0) > 1 && (
        <MultipleSelectionLockButton
          selectedTokens={selectedTokens}
          setSelectedTokens={setSelectedTokens}
          selectingMultipleLock={selectingMultipleLock}
          setSelectingMultipleLock={setSelectingMultipleLock}
          selectAllTokens={() => {
            setSelectedTokens(tokens);
          }}
        />
      )}
      {Object.keys(nftGroups).map((nftContractAddress) => (
        <LockNftListItem
          key={nftContractAddress}
          nftContractAddress={nftContractAddress}
          nfts={nftGroups[nftContractAddress]}
          selectedTokens={selectedTokens}
          selectingMultipleLock={selectingMultipleLock}
          onClickNftCard={handleSelect}
        />
      ))}
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
