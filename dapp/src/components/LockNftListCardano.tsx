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
import Grid from "@mui/material/Unstable_Grid2";
import { useCardanoBalance } from "../hooks/useCardanoBalance";
import { Token } from "../utils/cardano/token";
import LockNftButtonCardano from "./LockNftButtonCardano";
import { useGetNftsMetadataCardano } from "../hooks/useGetNftsMetadataCardano";
import { PolicyIdCardano } from "./PolicyIdCardano";

function LockNftListItemCardano({
  nft,
  metadata,
}: {
  nft: Token;
  metadata?: { image?: string };
}) {
  return (
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={metadata?.image ?? "/placeholder.png"}
        title={nft.getNameUtf8()}
      />
      <CardContent>
        <Stack>
          <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Typography variant="body2">{nft.getNameUtf8()}</Typography>
            <Typography variant="body2">{nft.amount.toString()}</Typography>
          </Stack>
          <PolicyIdCardano policyId={nft.asset.policyId} />
        </Stack>
      </CardContent>
      <CardActions>
        <LockNftButtonCardano token={nft} />
      </CardActions>
    </Card>
  );
}

export default function LockNftListCardano() {
  const { data: balance } = useCardanoBalance();
  const { data: nftMetadata } = useGetNftsMetadataCardano(
    balance?.getTokens().map((token) => token.asset) ?? [],
  );
  console.log("balance", balance);
  console.log("nft metadata", nftMetadata);
  return balance ? (
    <Grid container spacing={2} sx={{ width: "100%" }}>
      {balance?.getTokens().map((nft) => (
        <Grid xs={4} key={`${nft.getNameUtf8()}-${nft.getUnit()}`}>
          <LockNftListItemCardano
            nft={nft}
            metadata={nftMetadata?.[nft.asset.policyId]?.[nft.asset.name]}
          />
        </Grid>
      ))}
    </Grid>
  ) : (
    <CircularProgress />
  );
}
