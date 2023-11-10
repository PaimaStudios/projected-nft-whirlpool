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
import Grid from "@mui/material/Unstable_Grid2";
import { useGetNftsEVM } from "../hooks/useGetNftsEVM";
import LockNftButtonEVM from "./LockNftButtonEVM";
import { Nft } from "alchemy-sdk";
import MultilockButtonEVM from "./MultilockButtonEVM";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function LockNftListItemEVM({ nft }: { nft: Nft }) {
  return (
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={nft.media[0]?.gateway ?? "/placeholder.png"}
        title={nft.title}
      />
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
  const { data: nfts } = useGetNftsEVM();
  const nftGroups: Record<string, Nft[]> = {};
  nfts?.forEach((nft) => {
    if (!nftGroups[nft.contract.address]) {
      nftGroups[nft.contract.address] = [];
    }
    nftGroups[nft.contract.address].push(nft);
  });
  return nfts ? (
    Object.keys(nftGroups).length > 0 ? (
      <>
        {Object.keys(nftGroups).map((nftContractAddress) => (
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
                <MultilockButtonEVM
                  token={nftContractAddress}
                  tokenIds={nftGroups[nftContractAddress].map((nft) =>
                    BigInt(nft.tokenId),
                  )}
                />
                <Typography textAlign={"center"}>
                  or lock individually
                </Typography>
                <Grid container spacing={2}>
                  {nftGroups[nftContractAddress]
                    .sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
                    .map((nft) => (
                      <Grid
                        xs={4}
                        key={`${nft.contract.address}-${nft.tokenId}`}
                      >
                        <LockNftListItemEVM nft={nft} />
                      </Grid>
                    ))}
                </Grid>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </>
    ) : (
      <Typography>None.</Typography>
    )
  ) : (
    <CircularProgress />
  );
}
