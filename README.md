# Arc Microgrants workspace

**Arc Lab**: a graded lab for [Arc](https://docs.arc.io/). Each challenge is one thing Arc does differently from Ethereum; checker contracts on Arc grade each learner's deployment and record the result on-chain. Built for [Arc Microgrants | Circle](https://dorahacks.io/hackathon/arc-microgrants/detail).

**Current state:** contracts written, 21 local tests passing, and the full grading run simulated against Arc mainnet state with nothing sent. Not deployed yet. See [PRD](PRD.md) and [STATUS](docs/STATUS.md).

## Contracts

Requires [Arc Foundry](https://github.com/circlefin/arc-foundry) (`arc-forge`, tested with v0.8.0-2; Linux, macOS or WSL) and Node.js 24. Stock Foundry is not enough: it would run the tests under Ethereum rules, so the config rejects it.

```sh
cd contracts && arc-forge test
cd contracts && arc-forge build && cd .. && node scripts/simulate-mainnet.mjs
```

The tests fork Arc testnet at a pinned block, so Arc's real USDC system contract and SLH-DSA precompile do the grading; there are no mocks. The simulation runs the registry, both checkers and sample solutions inside one `eth_call` on Arc mainnet. Neither needs a wallet or spends anything.

## Program essentials

Checked against the official program page on **8 October 2026**:

- Submission closes **14 October 2026, 23:59 Eastern Time**, equivalent to **15 October, 03:59 UTC / 09:29 IST**.
- The program offers twenty grants of **500 USDC**, paid on Arc, with rolling reviews and decisions by 21 October.
- A working **Arc mainnet** deployment, **public repository**, short project description, and public builder profile are required.
- Selection considers Arc relevance, technical credibility, build quality, and potential for further development. No numerical weights are published on the page.

The repository stays private under the current instruction. The public-repository requirement is a submission blocker to resolve later; see [GAPS](GAPS.md). A scaffold or testnet-only demo does not meet the deployment requirement. Details and sources are in [RULES](RULES.md).

## Review order

1. [RULES](RULES.md): requirements, dates, exclusions, unresolved policies.
2. [PRD](PRD.md): idea-selection brief and feature-to-criterion template.
3. [ARCHITECTURE](ARCHITECTURE.md): implementation decisions to make after selection.
4. [PHASES](PHASES.md) and [GAPS](GAPS.md): build gates, time budget, risks.
5. [DEMO](DEMO.md): exact scaffold checks and future demo acceptance criteria.
6. [Arc setup](docs/ARC_SETUP.md), [submission checklist](docs/SUBMISSION.md), and [evidence ledger](docs/EVIDENCE.md).

## Run the scaffold

Requires **Node.js 24.x**, npm, and Git. These support repository tooling; they do not decide the eventual application language or framework.

```sh
npm ci
npm run check
```

Checks validate required files, local Markdown link targets, network configuration, and a limited set of accidental credential/file patterns. They do not prove application correctness or replace a security review.

Optional, read-only RPC checks:

```sh
npm run check:arc -- --network=testnet
npm run check:arc -- --network=mainnet
```

These request only chain ID and latest block number. They do not connect a wallet, sign, deploy, or transfer funds. RPC availability and observed blocks are separate from any future project deployment.

## Repository layout

```text
README.md / RULES.md
PRD.md / ARCHITECTURE.md / PHASES.md / GAPS.md / DEMO.md
docs/                 Setup, status, submission, and evidence
config/               Dated Arc network configuration
scripts/              Repository and read-only RPC checks
contracts/            Arc Lab contracts (src/) and Foundry tests (test/)
src/                  Reserved for the web page
tests/                Reserved for end-to-end tests
.github/workflows/    Repository checks for main and pull requests
```

There is no web page, deployment or wallet yet.

## Shared workflow

Use one `main` branch. Keep source facts and unresolved decisions explicit. Update the planning documents when the idea is selected; add only dependencies needed by that idea. Every major feature needs a selection-criterion mapping and observable acceptance evidence.

Local secrets, generated artifacts, and assistant continuity notes are ignored. `.env.example` contains public defaults only. No open-source license has been selected; `package.json` is marked `UNLICENSED` until the owner decides.

The owner authorized the scaffold push on 8 October 2026. For future updates, rerun `npm run check` and `git diff --check` and inspect staged files before pushing `main` to the private remote. Repository visibility changes, mainnet spending, and program submission are separate decisions.
