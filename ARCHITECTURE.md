# Architecture decisions

Status: **application architecture pending idea selection**. The current executable code is repository tooling only. No application framework or backend provider is selected.

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
| User interface | Undecided | Choose web, CLI, or infrastructure interface to match the beneficiary |
| Application language/framework | Undecided | Choose the smallest reproducible implementation after the experiment |
| Custom contracts | Optional | Use only if existing Arc primitives cannot deliver the selected result |
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
