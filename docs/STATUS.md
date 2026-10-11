# Project status

Updated: **11 October 2026, 17:40 UTC (23:10 IST)**. Deadline 15 October 2026, 03:59 UTC / 09:29 IST.

| Area | State | Evidence / next step |
| --- | --- | --- |
| Idea | Arc Lab, selected by the owner 10 Oct 2026 | [PRD](../PRD.md) |
| Requirements | Detail page re-verified 10 Oct 2026 | [RULES](../RULES.md); recheck before submission |
| Competition | At least 439 entries for 20 grants (10 Oct scan) | No recipients announced yet |
| Contracts | LabRegistry, VaultChecker, PostQuantumChecker, two starter contracts | `contracts/src` |
| Contract tests | 25/25 pass on the Arc EVM | E15 in [EVIDENCE](EVIDENCE.md): Arc Foundry, Arc testnet fork, no mocks |
| Mainnet simulation | Matches expectations | E13: real Arc USDC and precompile via `eth_call`, nothing sent |
| Testnet deployment | Deployed, source verified | E16, E17. Registry `0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1`; drip raised to 0.1 USDC (E19) |
| Testnet journey (script) | Passed | E18: enrol → drip → PASS both, FAIL recorded |
| Web page | Built; end-to-end test passes against Arc testnet | E20: Playwright, new learner enrolled from the page, both starters FAIL with explanations, both fixes PASS, board updated |
| Hosting | Live at [arc-lab-lemon.vercel.app](https://arc-lab-lemon.vercel.app), defaults to Arc mainnet; `?network=testnet` for the rehearsal | E24, E26 |
| Mainnet deployment | Deployed and source verified (Sourcify, exact match), block 25445558; same addresses as testnet | E25. Fees 0.0624 USDC; deployer holds 1.7175 USDC. Registry not funded yet, so no drip; no mainnet learner journey yet |
| CI | Passing on GitHub | E22: repository checks, page build and 25 Arc Foundry tests |
| Git | Branch `arc-lab` pushed; PR [#1](https://github.com/Harshyadav442277/microgrants/pull/1) into `main`, not merged | Repo renamed on GitHub to `microgrants` (old name redirects). Backups `arc-lab-backup-20261010`, `arc-lab-backup-20261010b` kept locally, not pushed |
| Public-source requirement | Unresolved | Repo private; owner decision before submission |
| Submission | Not submitted | [Checklist](SUBMISSION.md) |

## Decisions already established

- Arc Lab is the entry (owner, 10 Oct).
- Contracts are built and tested with Arc Foundry only; stock Foundry runs Ethereum rules.
- The deployer wallet `0x87E6832fB971A29b4228Ccf6A558f27822c063ED` stays in use although its key was exposed in chat (owner, 10 Oct); keep minimal mainnet funds in it.
- Builder-controlled wallets are labelled on the results board and never presented as learners.

## Next action

Owner: send 0.3–0.5 USDC from the deployer wallet to the registry `0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1` on Arc mainnet (recoverable with `withdraw`), then run one journey on the hosted page with MetaMask and a new learner wallet; Claude labels that wallet as a builder wallet and records the hashes. Owner decisions before submitting: public repo and license, MetaMask check, builder profile, then submit on DoraHacks ([draft](SUBMISSION.md)). Target 13 October (IST).
