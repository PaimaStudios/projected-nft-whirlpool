import { Unit } from 'lucid-cardano';
import { Asset } from './asset';

export class Token {
  asset: Asset;
  amount: bigint;

  constructor(asset: Asset, amount: bigint) {
    this.asset = asset;
    this.amount = amount;
  }

  getUnit(): Unit {
    return this.asset.getUnit();
  }

  getNameUtf8(): string {
    return this.asset.getNameUtf8();
  }
}
