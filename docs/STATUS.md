# Project status

Updated: **11 October 2026, 11:50 UTC (17:20 IST)**. Deadline 15 October 2026, 03:59 UTC / 09:29 IST.

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
| Hosting | Live at [arc-lab-lemon.vercel.app](https://arc-lab-lemon.vercel.app), Arc testnet | E24 |
| Mainnet product | Not deployed | Deployer holds 0 mainnet USDC (11 Oct 11:16 UTC). Needs about 1 USDC: ≈0.063 deployment + 0.1 per learner |
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

Owner: send about 1 USDC on Arc mainnet to `0x87E6832fB971A29b4228Ccf6A558f27822c063ED`. Then: deploy to mainnet, verify source, add mainnet to `config/deployments.json`, redeploy the page, run one journey on mainnet. Owner decisions before submitting: public repo and license, MetaMask check, builder profile, then submit on DoraHacks ([draft](SUBMISSION.md)). Target 13 October (IST).
