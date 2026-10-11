# Product brief: Arc Lab

Status: **selected by the owner on 10 October 2026; contracts written and tested locally; nothing deployed.** Evidence IDs refer to [EVIDENCE](docs/EVIDENCE.md); open questions live in [GAPS](GAPS.md).

## Selection brief

| Question | Decision / evidence |
| --- | --- |
| Project name | Arc Lab |
| Plain-language explanation | A graded lab for Arc. Each challenge is one thing Arc does differently from Ethereum. The learner deploys a small contract on Arc mainnet, and a checker contract on Arc grades it and records pass or fail on-chain. An instructor can enrol a class, and each enrolled learner receives a few cents of USDC for gas. |
| Who uses it, and in what situation? | A student or developer in a university blockchain club or an Arc workshop who already writes basic Solidity and is building on Arc for the first time. |
| What do they use today? | Arc's docs and its June–July 2026 bootcamp, which had no on-chain grading. Generic EVM wargames (Ethernaut style) teach Ethereum, not Arc. The Arc-specific behaviours below are documented on the EVM differences page, where nothing confirms whether a learner actually understood them. |
| Who cares enough to try it? | Club leads and workshop hosts who need a hands-on exercise with a result they can check; learners who want proof they can build on Arc. No real learner has been recruited yet (GAPS). |
| Smallest useful result | One learner, starting with no USDC, is enrolled, receives the drip, deploys a solution, submits it, and sees a PASS recorded on Arc mainnet that anyone can verify. |
| Why Arc is necessary | Both challenges test behaviour that exists only on Arc. The vault challenge relies on native USDC (18 decimals) and the USDC ERC-20 (6 decimals) being one balance, and on an ERC-20 transfer crediting a contract without running its code (E11). The signature challenge relies on Arc's SLH-DSA precompile at `0x1800…0004` (E12). On another chain neither checker can run. |
| What is most underestimated? | 1) Getting real learners in four days. 2) Reviewers may prefer apps to education. 3) Browser SLH-DSA signing speed: about 2 s in Node; untested in a browser. 4) Mainnet gas for a 7,856-byte signature submission (E13: about 0.015 USDC of execution, plus calldata). |
| Data and external services | Arc public RPC only. No backend, no database, no API key. Progress board reads on-chain events. |
| Reuse | None from earlier projects. Dependencies: Arc Foundry v0.8.0-2 (Apache-2.0) for build and tests, viem 2.56.9 and @noble/post-quantum 0.7.1 (MIT) for the scripts. |
| Smallest falsification experiment | Run both checkers with real Arc USDC and the real precompile, grading one correct and two wrong solutions each, before spending anything. **Passed** on mainnet state via `eth_call` (E13). Still open: the same journey as real transactions (testnet, then mainnet). |
| Team, available hours, spending ceiling | Owner-supplied; not yet given (GAPS). Expected mainnet spend: registry and checker deployments plus drips; estimate in GAPS until measured. |

## Challenges

| ID | Name | The learner must | Arc behaviour taught | Checker result codes |
| --- | --- | --- | --- | --- |
| 0 | Books that balance | Deploy a vault with `deposit()`, `totalAssets()` (in wei) and `withdrawAll(to)` | An ERC-20 transfer adds value without calling the vault; the 6-decimal view hides sub-10¹²-wei dust | OK, DEPOSIT_FAILED, WRONG_TOTAL, WITHDRAW_FAILED, LEFT_DUST, PAID_WRONG, ABORTED |
| 1 | Post-quantum signature | Sign `message(learner)` with their own SLH-DSA-SHA2-128s key; deploy `verify(vk, message, sig)` that uses Arc's precompile | Arc's post-quantum signature verifier | OK, BAD_INPUT, BAD_SIGNATURE, REJECTED_VALID, ACCEPTED_TAMPERED |

The vault checker runs its test inside a call that always reverts, so it moves no funds and needs only a float of a few 10¹² wei. Every solution must expose `learner()`, so one learner cannot submit another learner's deployment. Challenges considered and dropped: Memo payments and EIP-7708 native `Transfer` logs (the result is visible only in event logs, which a contract cannot read, so it cannot be graded on-chain); the 20 gwei fee floor (it cannot be observed from inside a contract).

## Feature-to-criterion mapping

| Feature | Beneficiary / result | Criterion | Estimate | Acceptance evidence | Keep/cut |
| --- | --- | --- | --- | --- | --- |
| `LabRegistry`: challenges, enrolment with drip, submit, on-chain results | Instructor runs a class; learner gets a verifiable result | Relevance; build quality | Done locally | 22 Arc Foundry fork tests (E15); mainnet simulation (E13) | Keep |
| Vault checker | Learner proves they handle Arc's two-decimal single balance | Relevance; technical credibility | Done locally | E13, E15 | Keep |
| Post-quantum checker | Learner proves they can use Arc's SLH-DSA precompile | Relevance; technical credibility | Done locally | E12, E13, E15 | Keep |
| Web page: challenge text, in-browser SLH-DSA signing, submit, progress board from events | Learner completes a challenge from a browser; reviewers can see results | Build quality; worth taking further | 8–12 h | Playwright run of the full journey on the deployed URL | Keep |
| Testnet then mainnet deployment, verified source | Reviewers open live contracts | Required for eligibility | 2–4 h after wallet funding | Deployment tx hashes, explorer links | Keep |
| Third challenge (EIP-2612 permit on Arc USDC) | More lab content | Worth taking further | 2 h | Tests plus simulation | Cut unless ahead of schedule |
| ERC-4337 paymaster, LLM tutor, prizes, NFTs | — | None | — | — | Cut |

## MVP boundary

One primary user (a learner in a club or workshop), one journey (enrolled → drip → deploy → submit → PASS on mainnet), one instructor action (enrol a list of addresses). Excluded: accounts, a backend, indexing infrastructure, bridging, AI, more than two challenges before the first mainnet deployment.

## Acceptance gates

- [x] Feasibility on real Arc state: both checkers grade correct and wrong solutions as expected (E13).
- [x] Meaningful local tests, including attack cases (forged result, someone else's solution, dust griefing), run on the Arc EVM (E15).
- [ ] Testnet: full journey as real transactions, with tx hashes.
- [ ] Mainnet: registry and checkers deployed and verified; at least one real PASS and one real FAIL recorded.
- [ ] Hosted page completes the journey (Playwright), from a fresh checkout.
- [ ] Public repository, license and declarations resolved by the owner before submission.

Nothing here claims users, traction or grant eligibility.
