# Projected NFT Whirlpool

The Projected NFT Whirlpool is a new protocol for the Paima Whirlpool vision to allow users from other ecosystems to naturally be able to use existing NFTs in games from other ecosystems while still maintaining custody.

**Motivation**: many games, due to being data and computation heavy applications, run on sidechains, L2s and appchain as opposed to popular L1 blockchains. This is problematic because popular NFT collections (which people generally want to use in-game) live on the L1 (a different environment). A common solution to this problem is building an NFT bridge, but bridges not only have a bad reputation for fungible tokens which limits usage, the problem is even worse for NFTs where there is also a philosophical disconnect (if a bridge gets hacked, which is the canonical NFT? The one the hacker stole, or the bridged asset?)

**Solution**: instead of bridging NFTs, we instead encourage users to *project* their NFT directly into the game, allowing them to access their asset in-game without having to bridge it to the game chain. Although the main use-case is projecting a single NFT, we support projecting multiple NFTs at once as well as fungible tokens

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/f301ec14-78d2-4e8d-b8fa-c9a10ae1f2bd)

**No free lunch**: note that using this solution means that running the game requires synchronizing multiple blockchains, as you need to run both the chain the game is hosted on, as well as the game where the NFTs are stored. This only requires checking the state of a single contract though.

# Technical details

To access their stateful NFT in-game, users need to put their NFT on the L1 in a *whirlpool hololocker*. This locker can be unlocked anytime by the user, but doing so removes access to the NFT from the game.

![image](https://github.com/dcSpark/projected-nft-whirlpool/assets/2608559/0cfcd47c-eaaf-4fe5-8b44-f5e50ed2da41)


## Supported lock conditions

### Locking using a public key hash

To create hololockers,
1. Send the asset(s) you want to project to the script hash of the hololocker with `{ owner: Owner::PKH(address), status: Status::Locked }` as the datum

To unlock/withdraw hololockers,
1. Include the hololocker as an input 
2. Include the required public key hash in the `required_signers` field of the transaction. Note that you do NOT need to actually withdraw the contents of the hololocker to the address specified in datum. It simply needs to be part of the `required_signers` of the transaction that withdraws the asset
3. (when unlocking) place the projected funds in a UTXO with the datum set to `Unlocking`
4. Sign the transaction using the required public key hash
5. (when withdrawing) you can withdraw the content to any address you wish

### Locking using a pre-existing NFT external to this script

To unlock, use a specific pre-existing NFT (`<policy, token_name>` pair). 

Strictly speaking, a fungible token could be used as the lock the hololocker, but only one unit is required to unlock (no pseudo-multisig). Note this token isn't burned in the transaction. 

To create hololockers,
1. Send the asset(s) you want to project to the script hash of the hololocker with `{ owner: Owner::NFT(policy_id, asset_name), status: Status::Locked }` as the datum

To unlock/withdraw hololockers,
1. Include the hololocker as an input
1. Include `nft_input_owner` which encodes the input (`{ tx_hash, index}` pair) of the transaction that contains the NFT used as a lock. This is done to avoid double-satisfaction (TODO: double check?)
1. (when unlocking) place the projected funds in a UTXO with the datum set to `Unlocking`
1. (when withdrawing) you can withdraw the content to any address you wish

### Locking using an NFT created specifically for this hololocker

This NFT has to be burned to unlock the NFT. Note that the hololocker script can be used both as a spending script and as a minting script to implement this use-case.

Note: you can create multiple of this type of hololockers at once (useful for airdrops).

To create hololockers,
1. Set the redeemer for the mint hololocker script as `{ total: Int }`
2. Specify `total` number of assets being minted, with the policy being the hololocker script and the asset name for each token `i=0..total` being `blake2b_256(cbor(input[0]), i)`. We use the first input of the transaction (`input[0]`) as this guarantees the uniqueness of the asset name, given nobody will ever be able to use the same `{ tx_hash, index}` pair again. 
3. Ensure that for every minted token, there is an equivalent standalone output which uses an inline datum `{ owner: Receipt(minted_asset_name), status: Locked }`. Include the assets you want to project in these outputs. Note that you can send the newly minted lock NFTs to any address you wish

To unlock/withdraw hololockers,
1. Include the UTXO holding the lock NFT as an input
2. Specify the hololocker as a mint policy that burns the lock NFT
3. Specify the hololocker as a mint policy that mints a new lock NFT (TODO: `new_receipt_owner`). This new NFT will be used when you want to withdraw the hololocker content
4. (when unlocking) place the projected funds in a UTXO with the datum set to `Unlocking` with the owner also set to the new `new_receipt_owner`
5. (when withdrawing) you can withdraw the content to any address you wish

## Multi-asset projection

Although the main use-case is projecting a single NFT, we support projecting multiple NFTs at once as well as fungible tokens. If multiple assets are used in a single projection, we also support partially unlocking funds from the hololocker by specifying `partial_withdraw` as part of the redeemer.

## Rollback handling

Note that updates in the hololocker cannot instantaneously be reflected in the game since it is possible the L1 rolls back. Therefore, projections need to wait a certain amount of time until they are confident that no rollback will occur (represented by `minimum_lock_time`).

### Unlock period

Claiming your NFT is done in two steps:
1. Shutting down the projection
2. Withdraw your NFT from the hololocker

Notably, users need to wait `ttl` + `minimum_lock_time` amount of time before they can withdraw their NFT. This is done on purpose to allow time for the game to react to your NFT being removed from the hololocker. Notably, we want the Paima Funnel to react to the NFT being unlocked before the user is able to actually withdraw their NFT

Otherwise, we could get into a situation where exists twice at the same time
*TODO: image of two timelines, comparing what doesn't work with what does*

## Questions that still need to be answered

Other than the TODOs in the document/code

1. Why do we need to specify `nft_input_owner` in the redeemer? I don't think this is needed to avoid double-satisfaction? (maybe it's because we don't burn the NFT? It could cause issues if two hololockers are redeemed to the same output that satisfies? Or maybe it's for performance reasons?)
2. Isn't it unsafe to allow an arbitrary `new_receipt_owner` (`next_receipt_name`) as the asset name? How do we ensure it doesn't collide with another existing lock somebody else made?
3. What was the rationale for the current value for `minimum_lock_time`?
4. Do we really want ttl + minimum_lock_time? We need to count blocks, not slots for finality (but maybe this is the best we can do?)
5. Why does `check_mint_and_outputs` allow burning tokens? It's only ever used to mint
6. When you withdraw in the `Receipt` case, doesn't the code force you to mint a new pointless token?
7. Why do we do `out_address == in_address && rem_address == in_address && ada_check && value_check && is_locked` at the end instead of using `expect`? Is returning false somehow more meaningful than just erroring?
8. Can we replace `""` all over the codebase with some constant like ADA_ASSET or something similar? (does Aiken not have something for this in the prelude?)
9. Why do we allow `in_ada_quantity <= rem_ada_quantity + out_ada_quantity`? I know changing this to strictly equal would stop you from using the in_ada to pay tx fees, but not checking for this would allow somebody to unlock ADA from the projection early (we don't care about this for our use-case, but maybe somebody would want to project ADA for some reason I guess since this codebase supports projecting other fungible tokens, and this might be unexpected behavior)
10. Should `partial_withdraw` be optional and default to false? This saves space, and avoids having to think about partial withdraw for the most common case (projecting a single NFT)
11. What's the point of `out_ref` in `Unlocking`? It's unused and setting it to `out_ref: own_out_ref` seems logically wrong anyway

# Building

1. Install Aiken ([link](https://aiken-lang.org/installation-instructions#from-aikup-linux--macos-only))
2. Run `aiken build` or `aiken check`
