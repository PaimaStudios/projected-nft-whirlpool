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

  static assetFromUtf8 = (policyId: PolicyId, name: string) => {
    return new Asset(policyId, fromText(name));
  };
}
