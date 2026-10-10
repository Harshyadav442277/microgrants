# Architecture decisions

Status: **Arc Lab contracts written and tested locally; web page not started; nothing deployed.**

## Arc Lab components

| Component | Role |
| --- | --- |
| `contracts/src/LabRegistry.sol` | Challenge list; instructor enrolment with a one-time native-USDC drip (a failed send skips that learner); `submit` → checker → `Submitted`/`Solved` events |
| `contracts/src/checkers/VaultChecker.sol` | "Books that balance": tests a learner's vault inside an always-reverting call, so no funds move |
| `contracts/src/checkers/PostQuantumChecker.sol` | "Post-quantum signature": checks the learner's SLH-DSA signature with the precompile, then their verifier on valid and tampered input |
| `contracts/test/` | Arc Foundry fork tests (Arc testnet, pinned block, no mocks); sample solutions; SLH-DSA signature fixture; `MainnetScenario` for the simulation |
| `scripts/make-pq-fixture.mjs` | Regenerates the test key and signature when the test's deployment order or learner changes |
| `scripts/simulate-mainnet.mjs` | Runs `MainnetScenario` as an `eth_call` on Arc: real USDC and precompile, no key, nothing sent |

Trust model: the registry owner can add challenges and spend the drip balance but cannot change a recorded result. Checkers hold no learner funds. A learner can keep the drip without attempting a challenge, so the drip is paid once per address and only to addresses the instructor enrols.

## Existing scaffold

| Component | Current role |
| --- | --- |
| `scripts/check-repo.mjs` | Offline repository hygiene, document-link and configuration checks |
| `scripts/check-arc.mjs` | Optional read-only RPC identity and latest-block check |
| `config/arc-networks.json` | Public mainnet/testnet values with source and verification date |
| `.github/workflows/check.yml` | Runs the offline checks after the first approved push |
| `src/`, `contracts/`, `tests/` | Reserved empty folders; no feature implementation |

## Decisions to make

| Decision | Current position | Selection trigger |
| --- | --- | --- |
| User interface | Static web page (planned) | Challenge text, in-browser signing, wallet submit, board from events |
| Application language/framework | Solidity 0.8.30 + Foundry for contracts; viem for scripts | Decided 10 Oct |
| Custom contracts | Required | On-chain grading is the product |
| Wallet model | Undecided | Establish custody, signing, user consent, and funding needs |
| Backend/storage | Optional | Add only if the core journey needs durable offchain state |
| AI/model/API | Optional | Prove usefulness, data rights, budget, and failure behavior first |
| Hosting | Undecided | Must expose the working deployment through a reviewer-accessible link |
| Source license | Undecided | Owner selects terms after checking reuse rights |

## Expected integration boundary

A typical implementation will connect the chosen interface to a small application layer and then to Arc. This is a planning shape, not deployed software. Keep network configuration explicit, require chain-ID validation, and make the result observable through receipts, logs, explorer links, or reproducible reads as appropriate.

Use integer/base-unit amounts with the correct native or ERC-20 decimals. Implement exact accounting assertions if the product moves value. Separate signing from read-only diagnostics; secrets belong in a secure runtime or wallet, never client bundles or source files. See [Arc setup](docs/ARC_SETUP.md).

## Failure and verification requirements

Document wrong-network behavior, unavailable RPC/services, rejected signatures, insufficient USDC, failed execution, and duplicate requests when applicable. Add only failure cases relevant to the selected design. Future transaction flows must distinguish an attempted call, a submitted transaction, and verified final state.

The [DEMO](DEMO.md) will define the full user journey. Unit checks alone cannot establish a working public mainnet deployment. Record architecture choices, dependency versions, verified behavior, and remaining limits in [STATUS](docs/STATUS.md).
