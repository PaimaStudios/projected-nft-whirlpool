"use client";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Unstable_Grid2";
import { useCardanoBalance } from "../hooks/useCardanoBalance";
import { Token } from "../utils/cardano/token";
import LockNftButtonCardano from "./LockNftButtonCardano";
import { useGetNftsMetadataCardano } from "../hooks/useGetNftsMetadataCardano";
import { PolicyIdCardano } from "./PolicyIdCardano";
import { useState } from "react";
import { isTokenNft } from "../utils/cardano/utils";

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
      <Stack />
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
  const [showOnlyNfts, setShowOnlyNfts] = useState(true);
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

  const handleChangeShowOnlyNftsSwitch = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setShowOnlyNfts(event.target.checked);
    setSelectedTokens(selectedTokens.filter((token) => isTokenNft(token)));
  };

  if (!balance) {
    return <CircularProgress />;
  }

  let tokens = balance.getTokens();
  if (showOnlyNfts) {
    tokens = tokens.filter((token) => isTokenNft(token));
  }

  return (
    <Stack sx={{ gap: 2, width: "100%" }}>
      {selectMultiple ? (
        <Stack sx={{ flexDirection: "row", justifyContent: "center", gap: 2 }}>
          <LockNftButtonCardano
            tokens={selectedTokens}
            actionText="Lock selected tokens"
            disabled={selectedTokens.length === 0}
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
          size="large"
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
          Click token cards to select/deselect
        </Typography>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={showOnlyNfts}
            onChange={handleChangeShowOnlyNftsSwitch}
          />
        }
        label="Show only NFTs"
        sx={{ alignSelf: "end" }}
      />
      <Grid container spacing={2} sx={{ width: "100%" }}>
        {tokens.map((nft) => (
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
  );
}
