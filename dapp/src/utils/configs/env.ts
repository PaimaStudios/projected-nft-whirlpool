import { bool, cleanEnv, str, url } from "envalid";

const env = cleanEnv(process.env, {
  REACT_APP_ALCHEMY_API_KEY: str(),
  REACT_APP_BLOCKFROST_PROJECT_ID: str(),
  REACT_APP_TESTNET: bool(),
  REACT_APP_CARDANO_API_URL_BASE: url(),
});

export default env;
