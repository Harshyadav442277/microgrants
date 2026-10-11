# Arc Lab

Graded exercises on the things [Arc](https://docs.arc.io/) does differently from Ethereum. A learner deploys a contract, submits its address, and a checker contract on Arc tests it. Pass or fail is written to the chain as an event, so anyone can check a result. Built for [Arc Microgrants | Circle](https://dorahacks.io/hackathon/arc-microgrants/detail).

**Live page:** https://arc-lab-lemon.vercel.app (Arc mainnet; add `?network=testnet` for the rehearsal network).

## Exercises

| Exercise | Arc behaviour it tests | Why it only works on Arc |
| --- | --- | --- |
| Books that balance | Native USDC (18 decimals) and the USDC token at `0x3600…0000` (6 decimals) are one balance. A token transfer credits a contract without running its code, and the token view rounds down dust | The checker deposits value both ways and checks the vault reports and pays out every wei |
| Post-quantum signature | Arc verifies SLH-DSA-SHA2-128s signatures through a precompile at `0x1800…0004` | The learner signs with their own key in the browser; the verifier must call the precompile and reject a tampered signature |

Each exercise ships a deliberately wrong starter contract. Submitting it fails with an explanation of the Arc behaviour it missed; the learner fixes it in Remix or Foundry and submits again. An instructor enrols a class from the same page, and each enrolled learner receives 0.1 USDC for gas, so a learner can start with an empty wallet.

## Deployments

Same addresses on both networks (same deployer, same nonces). Mainnet source verified on Sourcify (exact match).

| Contract | Address |
| --- | --- |
| `LabRegistry` | [`0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1`](https://repo.sourcify.dev/5042/0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1) |
| `VaultChecker` | [`0x73a3c3FA009767E8515F39E852764bdcdBBa540a`](https://repo.sourcify.dev/5042/0x73a3c3FA009767E8515F39E852764bdcdBBa540a) |
| `PostQuantumChecker` | [`0x54db435c807a89A2cC1209012431C465dd541323`](https://repo.sourcify.dev/5042/0x54db435c807a89A2cC1209012431C465dd541323) |

Arc mainnet, chain 5042, deployed in block 25445558. Transaction hashes, test runs and their limits are in the [evidence ledger](docs/EVIDENCE.md). Every learner on the results board so far is a test wallet controlled by the builder and is labelled as such.

## How it fits together

- `contracts/src/LabRegistry.sol` lists challenges, enrols learners with a gas drip, and records each submission as a `Submitted(learner, id, solution, passed, code)` event.
- `contracts/src/checkers/` grade a submitted contract inside a call that is reverted afterwards, so grading moves no money.
- `contracts/src/starters/` are the deliberately wrong starting points.
- `src/` is a static page (viem, `@noble/post-quantum`) that deploys starters, submits, explains verdicts and builds the results board from the registry's events. No server.

More detail: [ARCHITECTURE](ARCHITECTURE.md) and [PRD](PRD.md).

## Run it

Requires Node.js 24 and [Arc Foundry](https://github.com/circlefin/arc-foundry) (`arc-forge`, tested with v0.8.0-2; Linux, macOS or WSL). Stock Foundry runs Ethereum rules, so the config rejects it.

```sh
npm ci
npm run check                     # repository checks
cd contracts && arc-forge test    # 25 tests on the Arc EVM, forking Arc testnet; no mocks
npm run build:web                 # bundles the page into dist/
node scripts/serve.mjs dist 4174  # http://127.0.0.1:4174/
npm run test:e2e                  # full learner journey on Arc testnet; needs .env.local (see DEMO.md)
```

`node scripts/simulate-mainnet.mjs` (after `arc-forge build`) runs the registry, both checkers and sample solutions inside one `eth_call` on Arc mainnet, spending nothing.

## Status and limits

See [STATUS](docs/STATUS.md). Known limits: tested with MetaMask mobile and Chromium; the public Arc RPC and explorer rate-limit bursts, which the page backs off from; no outside learners yet.

## License

[MIT](LICENSE). The mainnet contracts were verified from source carrying the earlier `UNLICENSED` header; the code is otherwise identical.
