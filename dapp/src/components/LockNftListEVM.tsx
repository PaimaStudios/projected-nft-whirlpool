"use client";
import { CircularProgress, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { useGetNftsEVM } from "../hooks/useGetNftsEVM";
import LockNftButtonEVM from "./LockNftButtonEVM";

function LockNftListItemEVM({
  token,
  tokenId,
}: {
  token: string;
  tokenId: string;
}) {
  return (
    <>
      <Grid xs={7}>
        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
          {token}
        </Typography>
      </Grid>
      <Grid xs={1}>
        <Typography>{tokenId}</Typography>
      </Grid>
      <Grid xs={4} sx={{ display: "flex", justifyContent: "center" }}>
        <LockNftButtonEVM token={token as any} tokenId={BigInt(tokenId)} />
      </Grid>
    </>
  );
}

export default function LockNftListEVM() {
  const nfts = useGetNftsEVM();
  return nfts ? (
    nfts.length > 0 ? (
      <Grid container spacing={1} sx={{ alignItems: "center", width: "100%" }}>
        <Grid xs={7}>
          <Typography>Token address</Typography>
        </Grid>
        <Grid xs={1}>
          <Typography>ID</Typography>
        </Grid>
        <Grid xs={4} sx={{ display: "flex", justifyContent: "center" }}>
          <Typography>Action</Typography>
        </Grid>
        {nfts.map((nft) => (
          <LockNftListItemEVM
            key={`${nft.contract.address}-${nft.tokenId}`}
            token={nft.contract.address}
            tokenId={nft.tokenId}
          />
        ))}
      </Grid>
    ) : (
      <Typography>None.</Typography>
    )
  ) : (
    <CircularProgress />
  );
}
