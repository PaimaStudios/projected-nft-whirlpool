# Projected NFT Whirlpool EVM

This is a Projected NFT Whirlpool EVM smart contract.  
Sepolia is used as a testnet. Get test tokens [here](https://sepoliafaucet.com/)

<!-- Deployed on Sepolia: [0x](https://sepolia.etherscan.io/address/0x) -->

## Overview

NFT can be locked in the Hololocker contract in the following ways:

- by using the `lock` function of the Hololocker (requires owner to firstly set approval for the Hololocker contract to operate with the user's NFT), or
- by directly transferring the NFT to the Hololocker contract via calling `safeTransferFrom` on the NFT contract (this can also be used by set operators of the NFT)

  **WARNING**: Do **NOT** use `transferFrom` as a means of locking an NFT - The NFT will become **permanently stuck**. The `safeTransferFrom` variant must be used in order to initialize the lock and create a record of rightful owner.

After the NFT is locked, the owner or the address who initiated the lock can request an unlock via the `requestUnlock` function. After the unlock time has passed, the owner or the address who initiated the lock can withdraw the NFT back to the original owner via the `withdraw` function.

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

**Before deploying, adjust the initial lock time variable in `Deploy.s.sol`!**

Deploying will automatically verify the smart contracts on Etherscan. To disable this, remove the verifying arguments from the script.

```bash
yarn deploy:testnet
yarn deploy:mainnet
```

### Static analysis with [Slither](https://github.com/crytic/slither)

```bash
yarn analyze
```
