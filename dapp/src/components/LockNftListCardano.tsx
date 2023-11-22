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
import { useState } from "react";
import { useEffectOnce } from "usehooks-ts";

function LockNftListItemCardano({ nft }: { nft: Token }) {
  const [imageUrl, setImageUrl] = useState<string>();
  useEffectOnce(() => {
    async function fetchAndSetImage() {
      setImageUrl(await nft.asset.getImageUrl());
    }
    fetchAndSetImage();
  });
  return (
    <Card>
      <CardMedia
        sx={{ aspectRatio: 1, objectFit: "cover" }}
        image={imageUrl ?? "/placeholder.png"}
        title={nft.getNameUtf8()}
      />
      <CardContent>
        <Stack sx={{ justifyContent: "space-between" }}>
          <Typography variant="body2">{nft.getNameUtf8()}</Typography>
          <Typography variant="caption" sx={{ overflowWrap: "anywhere" }}>
            {nft.getUnit()}
          </Typography>
        </Stack>
      </CardContent>
      <CardActions>
        {/* <LockNftButtonCardano
          token={nft}
        /> */}
      </CardActions>
    </Card>
  );
}

export default function LockNftListCardano() {
  const { balance } = useCardanoBalance();
  console.log("balance", balance);
  return balance ? (
    <Grid container spacing={2} sx={{ width: "100%" }}>
      {balance?.getTokens().map((nft) => (
        <Grid xs={4} key={`${nft.getNameUtf8()}-${nft.getUnit()}`}>
          <LockNftListItemCardano nft={nft} />
        </Grid>
      ))}
    </Grid>
  ) : (
    <CircularProgress />
  );
}
