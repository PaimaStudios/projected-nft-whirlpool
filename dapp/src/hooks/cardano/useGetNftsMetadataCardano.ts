import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { Asset } from "../../utils/cardano/asset";
import {
  nftCborToJson,
  paginatedMetadataNft,
} from "@dcspark/carp-client/client/src/paginated";
import {
  TransactionMetadatum,
  decode_metadatum_to_json_str,
  MetadataJsonSchema,
} from "@dcspark/cardano-multiplatform-lib-browser";
import { processImage } from "../../utils/cardano/utils";
import env from "../../utils/configs/env";

export type MetadataCardano = {
  [policyId: string]: {
    [assetName: string]: {
      image?: string | undefined;
      [key: string]: any;
    };
  };
};

const fetchNftsMetadata = async (
  assets: Asset[],
): Promise<MetadataCardano | null> => {
  try {
    const assetsReqParam: Record<string, string[]> = {};
    assets.forEach((asset) => {
      if (!assetsReqParam[asset.policyId]) {
        assetsReqParam[asset.policyId] = [];
      }
      assetsReqParam[asset.policyId].push(asset.name);
    });

    const nftInfo = await paginatedMetadataNft(
      env.REACT_APP_CARDANO_API_URL_BASE,
      {
        assets: assetsReqParam,
      },
    );

    const jsonInfo = nftCborToJson(
      nftInfo,
      TransactionMetadatum,
      decode_metadatum_to_json_str,
      MetadataJsonSchema.BasicConversions,
    );

    const metadata: {
      [policyId: string]: {
        [assetName: string]: { image?: string };
      };
    } = {};
    for (const policyId in jsonInfo.cip25) {
      for (const name in jsonInfo.cip25[policyId]) {
        try {
          const parsed = JSON.parse(jsonInfo.cip25[policyId][name]);
          if (parsed.image) {
            parsed.image = processImage(parsed.image);
          }
          if (!metadata[policyId]) {
            metadata[policyId] = {};
          }
          metadata[policyId][name] = parsed;
        } catch (err) {
          console.error("Could not parse json", jsonInfo.cip25[policyId][name]);
        }
      }
    }

    return metadata;
  } catch (err) {
    return null;
  }
};

export const useGetNftsMetadataCardano = (assets: Asset[]) => {
  return useQuery({
    queryKey: [FunctionKey.NFTS_METADATA, { assets }],
    queryFn: () => fetchNftsMetadata(assets),
  });
};
