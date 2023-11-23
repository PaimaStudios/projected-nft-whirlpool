import { fromText, PolicyId, Unit, toText } from "lucid-cardano";

export class Asset {
  policyId: PolicyId; // hex
  name: string; // hex

  private imageUrl?: string;

  constructor(policyId: PolicyId, name?: string) {
    if (name) {
      this.policyId = policyId;
      this.name = name;
    } else {
      this.policyId = policyId.slice(0, 56);
      this.name = policyId.slice(57);
    }
  }

  getUnit(): Unit {
    return this.policyId + this.name;
  }

  getNameUtf8(): string {
    return toText(this.name);
  }

  getImageUrl = async (): Promise<string | undefined> => {
    if (this.imageUrl) {
      return this.imageUrl;
    }

    const networkId = process.env.NEXT_PUBLIC_NETWORK_ID;

    if (
      !process.env.REACT_APP_BLOCKFROST_PROJECT_ID_PREPROD ||
      !process.env.REACT_APP_BLOCKFROST_PROJECT_ID_MAINNET
    ) {
      throw Error(
        "You have to specify REACT_APP_BLOCKFROST_PROJECT_ID_PREPROD and REACT_APP_BLOCKFROST_PROJECT_ID_MAINNET in .env!",
      );
    }

    const asset = this.getUnit();
    // todo: fix project id leak
    const assetInfo = await fetch(
      process.env.REACT_APP_TESTNET === "true"
        ? `https://cardano-preprod.blockfrost.io/api/v0/assets/${asset}`
        : `https://cardano-mainnet.blockfrost.io/api/v0/assets/${asset}`,
      {
        method: "GET",
        headers: {
          PROJECT_ID:
            process.env.REACT_APP_TESTNET === "true"
              ? (process.env.REACT_APP_BLOCKFROST_PROJECT_ID_PREPROD as string)
              : (process.env.REACT_APP_BLOCKFROST_PROJECT_ID_MAINNET as string),
        },
      },
    ).then((res) => res.json());

    const ipfsUrl: string | undefined = assetInfo.onchain_metadata?.image;
    if (ipfsUrl) {
      const ipfsHash = ipfsUrl.substring("ipfs://".length);
      this.imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      return this.imageUrl;
    }

    return undefined;
  };

  static assetFromUtf8 = (policyId: PolicyId, name: string) => {
    return new Asset(policyId, fromText(name));
  };
}
