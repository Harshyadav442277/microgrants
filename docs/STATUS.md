# Project status

Updated: **11 October 2026, 19:25 UTC (12 October, 00:55 IST)**. Deadline 15 October 2026, 03:59 UTC / 09:29 IST.

| Area | State | Evidence / next step |
| --- | --- | --- |
| Idea | Arc Lab, selected by the owner 10 Oct 2026 | [PRD](../PRD.md) |
| Requirements | Detail page re-verified 10 Oct 2026 | [RULES](../RULES.md); recheck before submission |
| Contracts | LabRegistry, VaultChecker, PostQuantumChecker, two starter contracts | `contracts/src` |
| Contract tests | 25/25 pass on the Arc EVM | E15 in [EVIDENCE](EVIDENCE.md): Arc Foundry, Arc testnet fork, no mocks |
| Mainnet simulation | Matches expectations | E13: real Arc USDC and precompile via `eth_call`, nothing sent |
| Testnet deployment | Deployed, source verified | E16, E17. Registry `0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1`; drip raised to 0.1 USDC (E19) |
| Testnet journey (script) | Passed | E18: enrol → drip → PASS both, FAIL recorded |
| Web page | Built; end-to-end test passes against Arc testnet | E20: Playwright, new learner enrolled from the page, both starters FAIL with explanations, both fixes PASS, board updated |
| Hosting | Live at [arc-lab-lemon.vercel.app](https://arc-lab-lemon.vercel.app), defaults to Arc mainnet; `?network=testnet` for the rehearsal | E24, E26 |
| Mainnet deployment | Deployed and source verified (Sourcify, exact match), block 25445558; same addresses as testnet | E25. Fees 0.0624 USDC; deployer holds 1.7175 USDC. Gas fund 0.2 USDC after one enrolment |
| Mainnet journey (real wallet) | Exercise 1 FAIL recorded through MetaMask mobile | E27. Exercise 2 and PASS solutions not yet run on mainnet |
| CI | Passing on GitHub | E22: repository checks, page build and 25 Arc Foundry tests |
| Git | Branch `arc-lab` pushed; PR [#1](https://github.com/Harshyadav442277/microgrants/pull/1) into `main`, not merged | Repo renamed on GitHub to `microgrants` (old name redirects). Backups `arc-lab-backup-20261010`, `arc-lab-backup-20261010b` kept locally, not pushed |
| Public-source requirement | Met: repo public, MIT, `main` holds Arc Lab (PR #1 merged as `d14c31b`) | — |
| Submission | **Submitted** by the owner on DoraHacks, 11 Oct ~19:20 UTC (12 Oct ~00:50 IST); listed as "Under Review" | E28. Decisions by 21 Oct 2026 |

## Decisions already established

- Arc Lab is the entry (owner, 10 Oct).
- Contracts are built and tested with Arc Foundry only; stock Foundry runs Ethereum rules.
- The deployer wallet `0x87E6832fB971A29b4228Ccf6A558f27822c063ED` is a hackathon-only wallet; keep minimal mainnet funds in it and in the registry it owns.
- Builder-controlled wallets are labelled on the results board and never presented as learners.

## Next action

Submitted; await the decision (by 21 October). Optional before review: exercise 2 and PASS solutions on mainnet; re-check the E27 fixes (E29) on MetaMask mobile. Edits to the DoraHacks entry go through "Manage Submission".
