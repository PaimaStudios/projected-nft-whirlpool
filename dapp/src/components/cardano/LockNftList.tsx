"use client";
import {
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
import { useCardanoBalance } from "../../hooks/cardano/useCardanoBalance";
import { Token } from "../../utils/cardano/token";
import LockNftButton from "./LockNftButton";
import { useGetNftsMetadataCardano } from "../../hooks/cardano/useGetNftsMetadataCardano";
import { PolicyId } from "./PolicyId";
import { useState } from "react";
import { isTokenNft } from "../../utils/cardano/utils";
import MultipleSelectionLockButton from "./MultipleSelectionLockButton";

function LockNftListItem({
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
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
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
          <PolicyId policyId={nft.asset.policyId} />
        </Stack>
      </CardContent>
      <Stack />
      {!selectMultiple && (
        <CardActions>
          <LockNftButton
            tokens={[nft]}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            isPending={isPending}
            setIsPending={setIsPending}
          />
        </CardActions>
      )}
    </Card>
  );
}

export default function LockNftList() {
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
    <Stack sx={{ gap: 2, width: "100%", alignItems: "center" }}>
      <MultipleSelectionLockButton
        selectedTokens={selectedTokens}
        setSelectedTokens={setSelectedTokens}
        selectingMultipleLock={selectMultiple}
        setSelectingMultipleLock={setSelectMultiple}
        selectAllTokens={() => {
          setSelectedTokens(tokens);
        }}
      />
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
            <LockNftListItem
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
