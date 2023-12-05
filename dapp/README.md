# Projected NFT Whirlpool dApp

## Getting Started

1. Install the dependencies by running: `yarn`
2. Create `.env` file (copy from `.env.example`)
3. Start the development build by running: `yarn start`
4. Open [localhost:3000](http://localhost:3000) in your browser.

## Production

- Whitelist the production domain in the Alchemy and Blockfrost services for the keys you will be using, and turn on whitelist-only mode so that the keys cannot be abused outside our dApp.

### Generating contracts ABI (EVM)

Wagmi hooks are generated straight from the contracts source code at `../evm/` (this is configured in `wagmi.config.ts`).
Run `yarn generate` to generate new hooks when contracts are changed.
