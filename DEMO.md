# Demo and verification runbook

Status: **testnet journey verified end to end (E20); not hosted; not on mainnet yet.**

## The journey

| Step | Learner or instructor action | Expected result | Evidence |
| --- | --- | --- | --- |
| 1 | Instructor connects the owner wallet, pastes a learner address, presses **Enrol and send gas** | "Enrolled 1 of 1"; the learner receives the drip (0.1 USDC on testnet) | E20 |
| 2 | Learner connects; header shows the balance in both views (native 18 decimals, token 6 decimals) | Balance 0.1 | E20 |
| 3 | **Deploy starter vault**, then **Submit for grading** | FAIL: "wrong total", with the Arc explanation; recorded on-chain | E20 |
| 4 | Learner fixes the vault in their own tools, deploys, submits | PASS; status "Solved" | E20 |
| 5 | **Create key and sign** (SLH-DSA in the browser), **Deploy starter verifier**, submit | FAIL: "tampered signature accepted" | E20 |
| 6 | Learner fixes the verifier to call the precompile, deploys, submits | PASS; status "Solved" | E20 |
| 7 | Anyone opens the page | Results board lists the learner as solved in both, from registry events | E20 |

Failure handling shown in the page: no wallet, wrong network (switch or add Arc), rejected request, not enough gas, someone else's contract (`NotYourSolution`), missing `learner()`, not a contract.

## Reproduce

Requires Node.js 24, [Arc Foundry](https://github.com/circlefin/arc-foundry) (`arc-forge`) and a funded testnet registry owner key in `.env.local` for the transaction steps.

| Step | Command | Expected result |
| --- | --- | --- |
| 1 | `npm ci` then `npm run check` | `Repository checks passed.` |
| 2 | `cd contracts && arc-forge test` | 25 passed, 0 failed (forks Arc testnet) |
| 3 | `cd contracts && arc-forge build`, then `node scripts/simulate-mainnet.mjs` | `Simulation matches expectations.` (mainnet, `eth_call` only) |
| 4 | `npm run build:web` and `node scripts/serve.mjs dist 4174` | Page at `http://127.0.0.1:4174/?network=testnet` |
| 5 | `npm run test:e2e` (with `FOUNDRY_OUT` pointing at the forge output) | `1 passed`; spends about 0.1 test USDC from the registry drip plus instructor gas |

The end-to-end test bridges the page's wallet calls to Node, where viem signs with test keys; the fixed contracts are deployed from Node in place of the learner's Remix or Foundry. It runs against the live testnet, so it fails when the testnet RPC is down.

## Fresh checkout and outage rehearsal

Before submission, reproduce the steps above from a clean checkout and repeat the journey on mainnet. A recorded walkthrough must be labelled as one; it cannot replace the live mainnet requirement. Record each check in [EVIDENCE](docs/EVIDENCE.md).
