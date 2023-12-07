import { Alchemy, NftMetadataBatchToken } from "alchemy-sdk";
import { useAlchemy } from "../evm/useAlchemy";
import { useQuery } from "@tanstack/react-query";
import FunctionKey from "../../utils/functionKey";
import { MetadataNftCardanoResponse } from "../../utils/cardano/types";
import axios from "axios";
import { Token } from "../../utils/cardano/token";
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

// const nftInfo = JSON.parse(
//   '{"cip25":{"70abf0df92dde285bda393e1c3fe134b700cab2aa9ca750e9a5d2daa":{"434154":"a46b6465736372697074696f6e783554686973206973206d79206669727374204e4654207468616e6b7320746f207468652043617264616e6f20666f756e646174696f6e626964613165696d6167657835697066733a2f2f516d576d446953514d32776f6274666742796a7635435a316f4e6970735152334e737855526d37534c4a48536e71646e616d65782243617264616e6f20666f756e646174696f6e204e465420677569646520746f6b656e"}}}',
// ) as MetadataNftCardanoResponse;

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
    console.log("assets param", assetsReqParam);
    // const request = await axios.post(
    //   `${env.REACT_APP_CARDANO_API_URL_BASE}/metadata/nft`,
    //   { assets },
    // );
    // const responseData: ProjectedNftCardanoEventsResponse = request.data;

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
