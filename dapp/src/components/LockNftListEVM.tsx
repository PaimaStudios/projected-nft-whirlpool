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

function LockNftListItemEVM({
  nft,
  displayImage,
}: {
  nft: Nft;
  displayImage: boolean;
}) {
  return (
    <Card>
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
      <CardActions>
        <LockNftButtonEVM
          token={nft.contract.address}
          tokenId={BigInt(nft.tokenId)}
        />
      </CardActions>
    </Card>
  );
}

export default function LockNftListEVM() {
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
  // When pageKey of last page is undefined, it means there is no next page.
  const allNftsLoaded =
    nftsData?.pages[nftsData.pages.length - 1]?.pageKey === undefined;
  return nftsData ? (
    Object.keys(nftGroups).length > 0 ? (
      <Stack sx={{ gap: 2, width: "100%", alignItems: "center" }}>
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
                  {nftGroups[nftContractAddress].length > 1 && (
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
    ) : (
      <Typography>None.</Typography>
    )
  ) : (
    <CircularProgress />
  );
}
