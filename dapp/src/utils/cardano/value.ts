import { Assets, Lovelace, Unit } from 'lucid-cardano';
import { Asset } from './asset';
import { Token } from './token';

export type PlutusValueType = Map<string, Map<string, bigint>>;

export class Value {
  private lovelace?: Lovelace;
  private tokens: Token[];

  constructor(lovelace?: Lovelace, tokens?: Token[]) {
    this.lovelace = lovelace;
    this.tokens = tokens || [];
  }

  public getLovelace = () => this.lovelace;

  public getTokens = () => this.tokens;

  public getTokensSorted = () => {
    return this.tokens.sort((a, b) =>
      a.getNameUtf8().localeCompare(b.getNameUtf8()),
    );
  };

  public getToken = (tokenUnit: Unit) => {
    return this.tokens.find((t) => t.getUnit() === tokenUnit);
  };

  public setLovelace = (lovelace?: Lovelace) => {
    this.lovelace = lovelace;
  };

  public addToken = (token: Token) => {
    this.tokens.push(token);
  };

  public toAssetsMap = (): Assets => {
    const assets: Assets = {};

    if (this.lovelace) {
      assets['lovelace'] = this.lovelace;
    }

    for (const token of this.tokens) {
      assets[token.getUnit()] = token.amount;
    }

    return assets;
  };

  public static fromAssetsMap = (assetsMap: Assets, lovelace?: Lovelace) => {
    const assets: Value = new Value();
    const assetMapWithoutLovelace = { ...assetsMap };

    if (assetsMap['lovelace']) {
      assets.setLovelace(assetsMap['lovelace']);
      delete assetMapWithoutLovelace['lovelace'];
    }

    if (lovelace) {
      assets.setLovelace(assets.getLovelace() || 0n + lovelace);
    }

    for (const [tokenUnit, tokenValue] of Object.entries(
      assetMapWithoutLovelace,
    )) {
      if (tokenValue > 0) {
        const asset = new Asset(tokenUnit);
        const token = new Token(asset, tokenValue);
        assets.addToken(token);
      }
    }

    return assets;
  };

  public toPlutusData = (): PlutusValueType => {
    const val: PlutusValueType = new Map<string, Map<string, bigint>>();

    if (this.lovelace) {
      const innerMap = new Map<string, bigint>();
      innerMap.set('', this.lovelace);
      val.set('', innerMap);
    }

    for (const token of this.tokens) {
      let innerMap = val.get(token.asset.policyId);
      if (!innerMap) {
        innerMap = new Map<string, bigint>();
        val.set(token.asset.policyId, innerMap);
      }

      innerMap.set(token.asset.name, token.amount);
    }

    return val;
  };

  public static fromPlutusData = (plutusMap: PlutusValueType): Value => {
    const assets: Value = new Value();

    if (!plutusMap) return assets;

    plutusMap.forEach((policyIdMap, policyId) => {
      policyIdMap.forEach((tokenValue, tokenName) => {
        if (policyId === '' && tokenName === '') {
          assets.setLovelace(tokenValue);
        } else {
          const asset = new Asset(policyId, tokenName);
          const token = new Token(asset, tokenValue);
          assets.addToken(token);
        }
      });
    });

    return assets;
  };

  public add = (value: Value): Value => {
    const res = new Value();

    const lovelace = (this.lovelace || 0n) + (value.getLovelace() || 0n);
    res.setLovelace(lovelace || undefined);

    for (const token of [...this.tokens, ...value.getTokens()]) {
      const thisToken = this.getToken(token.getUnit());
      const addedToken = value.getToken(token.getUnit());
      if (thisToken && addedToken) {
        const newAmount = token.amount + addedToken.amount;
        const newToken = new Token(token.asset, newAmount);
        res.addToken(newToken);
      } else {
        res.addToken(token);
      }
    }

    return res;
  };

  public subtract = (value: Value): Value => {
    const res = new Value();

    const lovelace = (this.lovelace || 0n) - (value.getLovelace() || 0n);
    res.setLovelace(lovelace || undefined);

    for (const token of this.tokens) {
      const subtractedToken = value.getToken(token.getUnit());
      if (!subtractedToken) {
        res.addToken(token);
      } else if (subtractedToken && token.amount !== subtractedToken.amount) {
        const newAmount = token.amount - subtractedToken.amount;
        const newToken = new Token(token.asset, newAmount);
        res.addToken(newToken);
      }
    }

    return res;
  };
}
