"use client";
import {
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
import { useCardanoBalance } from "../hooks/useCardanoBalance";
import { Token } from "../utils/cardano/token";
import LockNftButtonCardano from "./LockNftButtonCardano";
import { useGetNftsMetadataCardano } from "../hooks/useGetNftsMetadataCardano";
import { PolicyIdCardano } from "./PolicyIdCardano";
import { useState } from "react";

function LockNftListItemCardano({
  nft,
  metadata,
  selectMultiple,
  isSelected,
  onClick,
}: {
  nft: Token;
  metadata?: { image?: string };
  selectMultiple: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      sx={{ width: "100%" }}
      variant={isSelected ? "outlined" : "elevation"}
      onClick={selectMultiple ? onClick : undefined}
    >
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
      {!selectMultiple && (
        <CardActions>
          <LockNftButtonCardano tokens={[nft]} />
        </CardActions>
      )}
    </Card>
  );
}

export default function LockNftListCardano() {
  const [selectMultiple, setSelectMultiple] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);
  const { data: balance } = useCardanoBalance();
  const { data: nftMetadata } = useGetNftsMetadataCardano(
    balance?.getTokens().map((token) => token.asset) ?? [],
  );
  console.log("balance", balance);
  console.log("nft metadata", nftMetadata);

  const handleSelect = (token: Token) => {
    if (selectedTokens.includes(token)) {
      setSelectedTokens(
        selectedTokens.filter((selectedToken) => selectedToken !== token),
      );
    } else {
      setSelectedTokens(selectedTokens.concat(token));
    }
  };

  return balance ? (
    <Stack sx={{ gap: 2 }}>
      {selectMultiple ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "center", gap: 2 }}>
          <LockNftButtonCardano
            tokens={selectedTokens}
            actionText="Lock selected tokens"
          />
          <Button
            onClick={() => {
              setSelectMultiple(!selectMultiple);
              setSelectedTokens([]);
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          variant="contained"
          sx={{ alignSelf: "center" }}
          onClick={() => {
            setSelectMultiple(!selectMultiple);
          }}
        >
          Lock multiple
        </Button>
      )}
      {!selectMultiple ? (
        <Typography textAlign={"center"}>or lock individually</Typography>
      ) : (
        <Typography textAlign={"center"}>
          Click token card to select/deselect
        </Typography>
      )}
      <Grid container spacing={2} sx={{ width: "100%" }}>
        {balance?.getTokens().map((nft) => (
          <Grid xs={3} key={`${nft.getNameUtf8()}-${nft.getUnit()}`}>
            <LockNftListItemCardano
              nft={nft}
              metadata={nftMetadata?.[nft.asset.policyId]?.[nft.asset.name]}
              selectMultiple={selectMultiple}
              isSelected={selectedTokens.includes(nft)}
              onClick={() => {
                handleSelect(nft);
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  ) : (
    <CircularProgress />
  );
}
