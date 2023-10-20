# Projected NFT Whirlpool EVM

This is a Projected NFT Whirlpool EVM smart contract.  
Sepolia is used as a testnet. Get test tokens [here](https://sepoliafaucet.com/)

<!-- Deployed on Sepolia: [0x](https://sepolia.etherscan.io/address/0x) -->

### Preparing for usage

1. Install Foundry by following the instructions from [their repository](https://github.com/foundry-rs/foundry#installation).
2. Copy the `.env.template` file to `.env` and fill in the variables.
3. Install the dependencies by running: `yarn`

### Compiling smart contracts

```bash
yarn compile
yarn compile:sizes (to see contracts sizes)
```

### Running local chain and deploying to it

```bash
yarn anvil
yarn deploy:localhost
```

### Deploying to testnet or mainnet

Deploying will automatically verify the smart contracts on Etherscan. To disable this, remove the verifying arguments from the script.

```bash
yarn deploy:testnet
yarn deploy:mainnet
```
