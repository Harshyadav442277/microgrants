# Project status

Updated: **10 October 2026**.

| Area | State | Evidence / next step |
| --- | --- | --- |
| Idea | **Arc Lab, selected by the owner 10 Oct 2026** | [PRD](../PRD.md) filled: two on-chain-graded challenges (vault accounting across 18/6 decimals; SLH-DSA precompile) |
| Requirements | Detail page re-verified 10 Oct 2026 | [RULES](../RULES.md); teams may submit more than one distinct project; recheck before submission |
| Competition | At least 439 entries for 20 grants (10 Oct scan) | No recipients announced yet |
| Local repository | Scaffold committed on `main` | Implementation revision `948e7748478131272c24c6275a8db4809f6e95e3`; verification notes recorded separately |
| GitHub repository | Private visibility verified after upload | [Harshyadav442277/arc-microgrants](https://github.com/Harshyadav442277/arc-microgrants); default branch `main` |
| Upload | Completed after owner authorization on 8 October | Initial scaffold push verified at `cb1043af8ad1e7d4dd1d5c2d250cbf12df04b4c7`; upload status recorded in a follow-up commit |
| Tooling checks | Passed locally and from a fresh local clone | `npm ci`, `npm run check`, and whitespace checks; see [EVIDENCE](EVIDENCE.md) |
| Live RPC diagnostics | Passed on both networks | Testnet chain 5042002; mainnet chain 5042; invalid input and wrong-chain endpoint rejected; no transaction executed |
| GitHub Actions | Workflow uploaded | Check the [live workflow runs](https://github.com/Harshyadav442277/arc-microgrants/actions) for results at the current revision |
| Contracts | Written, not deployed | `contracts/src`: LabRegistry, VaultChecker, PostQuantumChecker |
| Contract tests | 21/21 pass locally | E14 in [EVIDENCE](EVIDENCE.md); Arc behaviour mocked |
| Mainnet simulation | Matches expectations | E13: real Arc USDC and precompile via `eth_call`, nothing sent |
| Web page | Not started | Challenge pages, in-browser signing, submit, board |
| Testnet product | Not deployed | Rehearse after implementation |
| Mainnet product | Not deployed | Needs idea, tested implementation, wallet, and budget |
| Public demo | None | Requires deployment |
| Submission | Not submitted | [Checklist](SUBMISSION.md) remains open |
| Public-source requirement | Unresolved | Keep repo private now; later owner decision required |

## Decisions already established

- Keep the preparation repo private.
- Let the owner decide the project idea later.
- Prepare locally for review before pushing; owner authorized the scaffold push on 8 October.
- Use one `main` branch and a framework-neutral scaffold.
- Separate scaffold checks, live RPC observations, application behavior, deployment, and submission evidence.

## Next action

Owner: create a burner deployer wallet, fund it with testnet USDC (faucet.circle.com) and later a few USDC on mainnet, and log it. Then: deploy the registry and checkers on testnet, run the journey as real transactions, build the web page, deploy to mainnet. Target submission 13 October (IST); deadline 15 October 03:59 UTC / 09:29 IST.

Read-only mainnet checks done on 10 October (no transactions sent): the SLH-DSA verifier precompile, Memo with sender preserved, EIP-2612 and EIP-3009 on Arc USDC, deployed ERC-4337 and CREATE2 infrastructure, and the 20 gwei fee floor.
