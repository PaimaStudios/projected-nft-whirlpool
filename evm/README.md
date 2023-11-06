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

Forge will deploy the contract at a deterministic address due to specified salt in the `Deploy.s.sol` script, using [deterministic deployment proxy](https://github.com/Arachnid/deterministic-deployment-proxy). Ensure that the proxy (0x4e59b44847b379578588920ca78fbf26c0b4956c) is deployed on the chain you're deploying to.  
Also note that constructor args must also be the same. If you use different constructor args on different chains, the resulting deployment address will differ too.

Deploying will automatically verify the smart contracts on Etherscan. To disable this, remove the `--verify` argument from the script.

```bash
yarn deploy:testnet
yarn deploy:mainnet
```

### Static analysis with [Slither](https://github.com/crytic/slither)

```bash
yarn analyze
```

## Problems and thoughts

### NFT locking UX

Imagine you have a game that supports projected NFTs. You don't want to tell users "go do something on this other site and then come back here" since the user retention on that is probably not going to be very good (especially for mobile)
Embedding this directly inside the game isn't easy either because people will wonder where their NFT went. "I started playing game, it asked me to sign a tx to set my NFT for the game, and now my NFT is gone!!!" (not realizing they can unlock it)

One of ways to tackle this is to issue a soulbound receipt NFT upon locking, which the user burns when withdrawing the original NFT. However, this roughly doubles the gas cost of `lock` operation (85k gas units -> 161k gas units) and increases the cost of `withdraw` operation by 60% (7564 gas units -> 12125 gas units). Another caveat is that the receipt NFT might not even appear in user's crypto wallet (for example in Metamask you have to specifically enable the detection feature and it is available only on Ethereum).

### Projecting other standards (ERC20, ERC1155...)

Maybe somebody will want a feature in their game related to owning enough of the ERC20 token, or will want to support using ERC1155 tokens in-game.
We decided to not implement support for other standards right now, but it would be pretty easy to do so in the future, should the need appear.
