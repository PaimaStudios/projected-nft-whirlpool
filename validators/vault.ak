use aiken/bytearray
use aiken/cbor
use aiken/dict
use aiken/hash.{blake2b_256}
use aiken/interval.{Finite, Interval, IntervalBound}
use aiken/list
use aiken/transaction.{
  Datum, InlineDatum, Input, Mint, Output, OutputReference, ScriptContext, Spend,
  Transaction,
}
use aiken/transaction/credential.{PaymentCredential, ScriptCredential}
use aiken/transaction/value.{
  AssetName, PolicyId, add, quantity_of, to_list_advanced_usage,
  without_lovelace,
}

/// The datum for the locked assets
type State {
  /// The owner has the rights to withdrawl the full or
  /// partial amount
  owner: Owner,
  /// Whether the assets are locked or unlocking with a wait time
  status: Status,
}

/// Used to describe what state
/// some locked assets are in.
type Status {
  /// Assets are locked and no withdrawal attempt has been made
  Locked
  /// A withdrawal request has been made but
  /// things can only be unlocked after interval
  Unlocking { out_ref: OutputReference, for_how_long: Int }
}

/// This contract supports
/// many different kinds of owners
type Owner {
  /// Owner is a public key hash
  PKH(ByteArray)
  /// Owner is an NFT. Meaning
  /// whoever can spend this NFT can unlock.
  NFT(PolicyId, AssetName)
  /// A uniquely minted asset created on lock.
  /// Whoever can burn it can unlock.
  Receipt(AssetName)
}

/// Tells us if we are withdrawing everything or doing
/// a partial withdraw. It also tells us which input
/// an NFT resides in, this is only relevant for NFT owners
/// hence it's `Option`.
type Redeem {
  partial_withdraw: Bool,
  nft_input_owner: Option<OutputReference>,
  new_receipt_owner: Option<AssetName>,
}

type MintRedeemer {
  MintTokens { total: Int }
  BurnTokens
}

/// This is combined with the upper bound
/// of the validity range to get an exact slot
/// that the assets can be claimed at.
const minimum_lock_time =
  2000

/// Implemented as a multi-validator.
/// `spend` is for unlocking and claiming.
/// `mint` is only used in the case of `Receipt` owners.
validator {
  fn spend(datum: State, redeemer: Redeem, ctx: ScriptContext) -> Bool {
    let ScriptContext { transaction, purpose } =
      ctx

    expect Spend(own_out_ref) =
      purpose

    let Transaction {
      inputs,
      outputs,
      mint,
      validity_range,
      extra_signatories,
      ..
    } =
      transaction

    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == own_out_ref })

    let Input {
      output: Output { address: in_address, value: in_value, .. },
      ..
    } =
      own_input

    let State { owner, status } =
      datum

    // Checks current owner is valid and gets next owner
    let next_owner =
      when owner is {
        // An owner can be a public key, a spent NFT, or a burned receipt token that was minted by this script
        PKH(signer) -> {
          expect True =
            list.has(extra_signatories, signer)
          owner
        }
        // In this case the redeemer out ref refers to some other input that holds the nft 
        // that we check is spent
        NFT(policy, token_name) -> {
          expect Some(nft_input_owner) =
            redeemer.nft_input_owner

          expect Some(nft_input) =
            list.find(
              inputs,
              fn(input) { input.output_reference == nft_input_owner },
            )

          expect True =
            quantity_of(nft_input.output.value, policy, token_name) == 1
          owner
        }

        Receipt(token_name) -> {
          let payc =
            in_address.payment_credential

          expect Some(next_receipt_name) =
            redeemer.new_receipt_owner

          expect ScriptCredential(policy) =
            payc

          expect True =
            quantity_of(mint, policy, token_name) == -1 && quantity_of(
              mint,
              policy,
              next_receipt_name,
            ) == 1

          Receipt(next_receipt_name)
        }
      }

    let Interval { lower_bound, upper_bound } =
      validity_range

    when status is {
      Locked -> {
        let IntervalBound { bound_type, .. } =
          upper_bound

        expect Finite(upper) =
          bound_type

        // upper bound + minimum_lock_time = for_how_long
        let output_unlocking_datum =
          State {
            owner: next_owner,
            status: Unlocking {
              out_ref: own_out_ref,
              for_how_long: upper + minimum_lock_time,
            },
          }

        let outputs_offset =
          find_outputs_offset(outputs, InlineDatum(output_unlocking_datum))

        if redeemer.partial_withdraw {
          // case for partial withdraws
          expect [unlocking_output, remainder_output, ..] =
            outputs_offset

          let Output { address: out_address, value: out_value, .. } =
            unlocking_output

          let Output { address: rem_address, value: rem_value, datum, .. } =
            remainder_output

          expect InlineDatum(datum) =
            datum

          expect State { status, .. }: State =
            datum

          let is_locked =
            status == Locked

          expect [(in_ada_policy, in_ada_amount), ..in_rest_values] =
            to_list_advanced_usage(in_value)

          expect Some(in_ada_quantity) =
            dict.get(in_ada_amount, "")

          expect [(rem_ada_policy, rem_ada_amount), ..] =
            to_list_advanced_usage(rem_value)

          expect [(out_ada_policy, out_ada_amount), ..] =
            to_list_advanced_usage(out_value)

          expect Some(out_ada_quantity) =
            dict.get(out_ada_amount, "")

          expect Some(rem_ada_quantity) =
            dict.get(rem_ada_amount, "")

          let out_ada_total =
            rem_ada_quantity + out_ada_quantity

          let ada_check =
            in_ada_quantity <= out_ada_total && in_ada_policy == "" && out_ada_policy == "" && rem_ada_policy == ""

          let rem_value_no_ada =
            rem_value |> without_lovelace

          let total_value_no_ada =
            out_value
              |> without_lovelace
              |> add(rem_value_no_ada)
              |> to_list_advanced_usage

          let value_check =
            in_rest_values == total_value_no_ada && ada_check

          out_address == in_address && rem_address == in_address && ada_check && value_check && is_locked
        } else {
          expect [unlocking_output, ..] =
            outputs_offset

          let Output { address: out_address, value: out_value, .. } =
            unlocking_output

          expect [(in_ada_policy, in_ada_amount), ..in_rest_values] =
            to_list_advanced_usage(in_value)

          expect Some(in_ada_quantity) =
            dict.get(in_ada_amount, "")

          expect [(out_ada_policy, out_ada_amount), ..out_rest_values] =
            to_list_advanced_usage(out_value)

          expect Some(out_ada_quantity) =
            dict.get(out_ada_amount, "")

          let ada_check =
            in_ada_quantity <= out_ada_quantity && in_ada_policy == "" && out_ada_policy == ""

          let value_check =
            in_rest_values == out_rest_values

          out_address == in_address && ada_check && value_check
        }
      }

      Unlocking { for_how_long, .. } -> {
        // lower bound check
        let IntervalBound { bound_type, .. } =
          lower_bound

        expect Finite(lower) =
          bound_type

        for_how_long <= lower
      }
    }
  }

  /// If the owner is a `Receipt` then we'll need this
  /// to mint a unique asset that acts as the owner of the locked
  /// assets.
  fn mint(redeemer: MintRedeemer, ctx: ScriptContext) -> Bool {
    // get values from transaction and purpose
    let ScriptContext { transaction, purpose } =
      ctx

    expect Mint(policy_id) =
      purpose

    let Transaction { inputs, outputs, mint, .. } =
      transaction

    let minted_assets =
      mint
        |> value.tokens(policy_id)
        |> dict.to_list()

    when redeemer is {
      BurnTokens ->
        list.all(
          minted_assets,
          fn(asset) {
            let (_, amount) =
              asset
            amount == -1
          },
        )
      MintTokens { total } -> {
        expect [input, ..] =
          inputs

        // Base is created from serializing a utxo ref being spent. Thus this guarantees a unique base
        let base =
          cbor.serialise(input.output_reference)

        // Create a list of expected token names
        let expected_minted_token_names =
          create_expected_minted_nfts(base, total, [])

        // Support multiple gift card creation by allowing a
        // 'number of tokens minted' == 'outputs with datum being token name'
        check_mint_and_outputs(
          minted_assets,
          outputs,
          expected_minted_token_names,
          ScriptCredential(policy_id),
        )
      }
    }
  }
}

fn find_outputs_offset(
  outputs: List<Output>,
  output_datum: Datum,
) -> List<Output> {
  expect [output, ..rest_outputs] =
    outputs

  if output.datum == output_datum {
    outputs
  } else {
    find_outputs_offset(rest_outputs, output_datum)
  }
}

// Check each minted token name is in the expected list, has quantity of 1,
// and has a corresponding ouput with datum containing token name.
// Otherwise fail
fn check_mint_and_outputs(
  minted_assets: List<(ByteArray, Int)>,
  outputs: List<Output>,
  expected_assets: List<ByteArray>,
  validator_cred: PaymentCredential,
) -> Bool {
  when minted_assets is {
    [] ->
      True
    [(minted_asset_name, quantity), ..rest_assets] ->
      if quantity == 1 {
        expect True =
          list.any(
            expected_assets,
            fn(expected_asset) { expected_asset == minted_asset_name },
          )

        let expected_datum =
          InlineDatum(
            State { owner: Receipt(minted_asset_name), status: Locked },
          )

        expect True =
          list.any(
            outputs,
            fn(output) {
              let Output { address, datum, .. } =
                output
              datum == expected_datum && address.payment_credential == validator_cred
            },
          )

        check_mint_and_outputs(
          rest_assets,
          outputs,
          expected_assets,
          validator_cred,
        )
      } else if quantity == -1 {
        check_mint_and_outputs(
          rest_assets,
          outputs,
          expected_assets,
          validator_cred,
        )
      } else {
        False
      }
  }
}

fn create_expected_minted_nfts(
  base: ByteArray,
  counter: Int,
  accum: List<ByteArray>,
) -> List<ByteArray> {
  if counter == 0 {
    accum
  } else {
    let token_name =
      blake2b_256(bytearray.push(base, counter))

    let accum =
      [token_name, ..accum]

    create_expected_minted_nfts(base, counter - 1, accum)
  }
}
