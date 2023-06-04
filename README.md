# Projected NFT Whirlpool

The Projected NFT Whirlpool is a new protocol for the Paima Whirlpool vision to allow users from other ecosystems to naturally be able to use existing NFTs in games from other ecosystems while still maintaining custody.

**Motivation**: many games, due to being data and computation heavy applications, run on sidechains, L2s and appchain as opposed to popular L1 blockchains. This is problematic because popular NFT collections (which people generally want to use in-game) live on the L1 (a different environment). A common solution to this problem is building an NFT bridge, but bridges not only have a bad reputation for fungible tokens which limits usage, the problem is even worse for NFTs where there is also a philosophical disconnect (if a bridge gets hacked, which is the canonical NFT? The one the hacker stole, or the bridged asset?)

**Solution**: instead of bridging NFTs, we instead encourage users to *project* their NFT directly into the game, allowing them to access their asset in-game without having to bridge it to the game chain. Although the main use-case is projecting a single NFT, we support projecting multiple NFTs at once as well as fungible tokens

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/f301ec14-78d2-4e8d-b8fa-c9a10ae1f2bd)

**No free lunch**: note that using this solution means that running the game requires synchronizing multiple blockchains, as you need to run both the chain the game is hosted on, as well as the game where the NFTs are stored. This only requires checking the state of a single contract though.

# High-level flow

To access their stateful NFT in-game, users need to put their NFT on the L1 in a *whirlpool hololocker*. This locker can be unlocked anytime by the user, but doing so removes access to the NFT from the game.

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/0cfcd47c-eaaf-4fe5-8b44-f5e50ed2da41)

# Finality period

Since the L1 and Paima run on different chains, we have to take L1 finality into account before actions in the hololocker are actionable in-game

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/db12a520-e7d0-46d2-84c0-848303dc2618)

## Issue #1: rollbacks

Note that updates in the hololocker cannot instantaneously be reflected in the game since it is possible the L1 rolls back. Therefore, projections need to wait a certain amount of time until they are confident that no rollback will occur (represented by `minimum_lock_time`).

Failing to take into account, rollbacks could lead to the game getting into an invalid state as seen in the picture below

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/7c0adde6-b187-472c-91dc-ce052b6613be)

## Issue #2: temporary duplication

If we did not have a special "Unlocking" state that requires users to wait for finality on the L1 before withdrawing their NFT, it could cause a situation where the same NFT is used in two places at once, which is unexpected

This means that withdrawing your NFT is done in two steps:
1. Shutting down the projection
2. Withdraw your NFT from the hololocker

Failing to take into account, the same NFT can be used in two places at once as seen in the picture below

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/e80558e6-fac1-43d6-9641-f70435a16272)

## Timing seconds instead of blocks

Finality is typically defined in terms of blocks. For example, in Bitcoin, people heuristically define finality as 6 blocks.

However, this definition is sightly problematic for our use case, because there is no guarantee every node running the game sees the 6th block at the same time (due to differences in block propagation in a global decentralized network). Notably, Paima runs on the clock of the chain hosting the game, and so there is no way for Paima to rely on the chain hosting the game to globally determine the block number of the chain where the hololocker exists. Additionally, there are blockchains like Cardano where you cannot even refer to blocks from smart contracts (to maintain determinism), and so knowing progress towards finality cannot be known. 

Therefore, it is easier to define the finality heuristically in terms of seconds since the transaction was made on the L1, which can be known. Note that this will not work for blockchains where you cannot define a deterministic mapping of blocks to timestamps with a precision lower than half the block time on the chain hosting the game, but in practice this exists for all major blockchains

### Cardano specifically

In Cardano, finality is measured by `ttl` + `minimum_lock_time`

`ttl` and `minimum_lock_time` are measured in *slots*, despite the fact that finality is measured in *blocks*. These are not the same thing, since there can be many empty slots in Cardano (which contribute nothing to finality). However, in order to ensure determinism, Cardano smart contracts only have access to slots, which last an undefined period of time (which may change in future hardforks) and where the current duration of a slot cannot be known from a smart contract (as of Babbage)

# Multi-asset projection

Although the main use-case is projecting a single NFT, we support projecting multiple NFTs at once as well as fungible tokens. If multiple assets are used in a single projection, we also support partially unlocking funds from the hololocker by specifying `partial_withdraw` as part of the redeemer when moving funds from `Locked` to `Unlocking` - allowing the remaining funds to stay projected

Note that the funds that are kept locked do not have to be kept in the same hololocker type. Although switching the type is not an important feature in the usual case, it's important in the `Receipt` as you will have to mint a new receipt NFT to to unlock the projected funds later.

# Supported lock conditions

## Locking using a public key hash

To create hololockers,
1. Send the asset(s) you want to project to the script hash of the hololocker with `{ owner: Owner::PKH(address), status: Status::Locked }` as the datum

To unlock/withdraw hololockers,
1. Include the hololocker as an input 
2. Include the required public key hash in the `required_signers` field of the transaction. Note that you do NOT need to actually withdraw the contents of the hololocker to the address specified in datum. It simply needs to be part of the `required_signers` of the transaction that withdraws the asset
3. (when unlocking) place the projected funds you want to unlock in a UTXO with the inline datum set to `State { owner, Unlocking { out_ref, for_how_long } }` where `owner` is the same as before, `out_ref` is the `{ tx_hash, index}` pair of the utxo input from (1), and `for_how_long` is `ttl + minimum_lock_time`
4. (if `partial_withdraw` when unlocking) place the remaining funds in a inline datum representing their new hololocker in the output index directly following the output of the funds you are unlocking
5. Sign the transaction using the required public key hash
6. (when withdrawing) you can withdraw the content to any address you wish

## Locking using a pre-existing NFT external to this script

To unlock, use a specific pre-existing NFT (`<policy, token_name>` pair). This is useful for example in the case of a NFT-backed multisig script where you do not have a specific public key hash to use as a lock.

Strictly speaking, a fungible token could be used as the lock the hololocker, but only one unit is required to unlock (no pseudo-multisig). Note this token isn't burned in the transaction. 

To create hololockers,
1. Send the asset(s) you want to project to the script hash of the hololocker with `{ owner: Owner::NFT(policy_id, asset_name), status: Status::Locked }` as the datum

To unlock/withdraw hololockers,
1. Include the hololocker as an input
2. Include `nft_input_owner` which encodes the input (`{ tx_hash, index}` pair) of the transaction that contains the NFT used as a lock. This is just for performance optimization
3. (when unlocking) place the projected funds you want to unlock in a UTXO with the inline datum set to `State { owner, Unlocking { out_ref, for_how_long } }` where `owner` is the same as before, `out_ref` is the `{ tx_hash, index}` pair of the utxo input from (1), and `for_how_long` is `ttl + minimum_lock_time`
4. (if `partial_withdraw` when unlocking) place the remaining funds in a inline datum representing their new hololocker in the output index directly following the output of the funds you are unlocking
5. (when withdrawing) you can withdraw the content to any address you wish

## Locking using an NFT created specifically for this hololocker (a "Receipt")

This NFT has to be burned to unlock the NFT. Note that the hololocker script can be used both as a spending script and as a minting script to implement this use-case.

Note: you can create multiple of this type of hololockers at once (useful for airdrops).

To create hololockers,
1. Set the redeemer for the mint hololocker script as `{ total: Int }`
2. Specify `total` number of assets being minted, with the policy being the hololocker script and the asset name for each token `i=0..total` being `blake2b_256(cbor(input[0]), i)`. We use the first input of the transaction (`input[0]`) as this guarantees the uniqueness of the asset name, given nobody will ever be able to use the same `{ tx_hash, index}` pair again. 
3. Ensure that for every minted token, there is an equivalent standalone output which uses an inline datum `{ owner: Receipt(minted_asset_name), status: Locked }`. Include the assets you want to project in these outputs. Note that you can send the newly minted lock NFTs to any address you wish

To unlock hololockers,
1. Include the UTXO holding the lock NFT as an input
2. Specify the hololocker as a mint policy that burns the lock NFT
3. Specify the hololocker as a mint policy that mints a new lock NFT (its asset name will be set using the same deterministic rule as mentioned in the section on creating the hololocker). This new NFT will be used when you want to withdraw the hololocker content.
4. Add the asset name of the newly minted NFT in the redeemer of the spend condition (as `new_receipt_owner`)
5. Place the projected funds you want to unlock in a UTXO with the inline datum set to `State { owner: new_receipt_owner, Unlocking { out_ref, for_how_long } }` where `out_ref` is the `{ tx_hash, index}` pair of the utxo input from (1), and `for_how_long` is `ttl + minimum_lock_time`
6. (if `partial_withdraw`) place the remaining funds in a inline datum representing their new hololocker in the output index directly following the output of the funds you are unlocking

To withdraw hololockers,
1. Include the UTXO holding the lock NFT as an input
2. Specify the hololocker as a mint policy that burns the unlock NFT
3. You can withdraw the content to any address you wish

# Building

1. Install [Aiken](https://aiken-lang.org/installation-instructions)
2. Run `aiken build` or `aiken check`
