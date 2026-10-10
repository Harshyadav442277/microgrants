# Project status

Updated: **10 October 2026, 19:45 UTC (11 October, 01:15 IST)**. Deadline 15 October 2026, 03:59 UTC / 09:29 IST.

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
| Hosting | Not hosted | Needs owner yes for a public URL |
| Mainnet product | Not deployed | Needs mainnet USDC in the deployer wallet and owner yes (≈0.063 USDC deployment + 0.1 USDC per learner) |
| CI | Repository checks, page build and Arc Foundry contract tests defined | Never run on GitHub: branch `arc-lab` not pushed |
| Git | Branch `arc-lab`, not pushed; `main` untouched | Backup of the pre-rewrite history kept locally as `arc-lab-backup-20261010` |
| Public-source requirement | Unresolved | Repo private; owner decision before submission |
| Submission | Not submitted | [Checklist](SUBMISSION.md) |

## Decisions already established

- Arc Lab is the entry (owner, 10 Oct).
- Contracts are built and tested with Arc Foundry only; stock Foundry runs Ethereum rules.
- The deployer wallet `0x87E6832fB971A29b4228Ccf6A558f27822c063ED` stays in use although its key was exposed in chat (owner, 10 Oct); keep minimal mainnet funds in it.
- Builder-controlled wallets are labelled on the results board and never presented as learners.

## Next action

Owner: say yes to hosting the page (Vercel) and to the mainnet deployment once the deployer wallet holds about 1 USDC on Arc mainnet. Then: deploy to mainnet, add it to `config/deployments.json`, run the journey on mainnet, host, and prepare the submission. Target submission 13 October (IST).
