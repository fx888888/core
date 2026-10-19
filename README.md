# CORE Fishing Game App

A mobile-first starter for a CORE-chain fishing game. This repository currently contains a simple native-CORE ammo shop contract, a Hardhat project, basic contract tests, and a wallet-connected web UI.

## Current scope

- Solidity contract `FishingShop`: users can buy ammo packs with native CORE and consume packs.
- Mobile-friendly static frontend in `site/`.
- Hardhat config for Core Testnet2 (chain ID 1114) and Core Mainnet (chain ID 1116).
- Automated compile/test workflow.

## Important limitations

This is a starter, **not a production-audited game**. There is no on-chain random number generation, prize payout, gambling, leaderboard, or trusted backend. The current UI is a shop interaction demo, not a complete fishing game. Review the contract, test on testnet, and arrange an independent security review before mainnet use.

## Requirements

Node.js 20 or later and npm.

## Install and test

```bash
npm install
npm run compile
npm test
```

## Deploy to Core Testnet2 first

1. Copy `.env.example` to `.env`.
2. Create a separate test wallet and put its private key in `PRIVATE_KEY` locally in `.env`. Never upload `.env` or a real private key to GitHub.
3. Fund that test wallet with testnet gas.
4. Run:

```bash
npm run deploy:testnet
```

Save the printed contract address.

## Configure the frontend

Open `site/app.js` and replace the empty `CONTRACT_ADDRESS` value with the contract address printed by the deployment script. Open `site/index.html` in a local static server or publish the `site/` directory to a static host. The frontend uses ethers v6 from a pinned CDN version.

## Mainnet deployment

Do not run `npm run deploy:mainnet` until testnet compile/tests and manual wallet flows have passed, the contract and price have been reviewed, and you understand the owner controls. Core Mainnet uses chain ID 1116 and RPC `https://rpc.coredao.org`. Mainnet deployment costs real CORE and is not performed by this repository upload.

## Current initial price

The deploy script sets one ammo pack to 0.001 CORE. Change and review this value in `scripts/deploy.js` before deployment if needed.

## License

MIT
