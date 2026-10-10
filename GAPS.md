# Gaps and ranked risks

Last updated: **11 October 2026 (IST)**. This list names blockers rather than treating scaffold completion as grant eligibility.

## Wallets (burners only)

| Address | Purpose | Created / logged | Key location | State |
| --- | --- | --- | --- | --- |
| `0x87E6832fB971A29b4228Ccf6A558f27822c063ED` | **Active.** Owner-created hackathon wallet: Arc Lab deployer and `LabRegistry` owner (instructor), testnet and mainnet | Logged 10 Oct 2026 18:54 UTC / 11 Oct 00:24 IST | `.env.local` as `DEPLOYER_PRIVATE_KEY` (git-ignored) | **Key exposed:** pasted in chat ~19:03 UTC. Rotation recommended; owner decided at ~19:08 UTC to keep using it. Keep only the minimum mainnet USDC in it. 20 testnet USDC at 19:09 UTC |
| `0x239F2fa36A461a477d92336a65A56164a188fF4C` | Unused. Generated locally as a replacement, then dropped at the owner's request | Generated 10 Oct 2026 19:04 UTC | Key overwritten in `.env.local`; not kept | Never funded |
| `0x7b4a0Cb81cd4a0D12A89F23aeec110574afd997a` | Superseded; not used by Arc Lab. Owner replaced it with a hackathon-specific wallet | Logged 10 Oct 2026 18:50 UTC | Not held by this project | Balance 0, nonce 0 at 18:50 UTC; never funded or used here |

## Open as of 10 October 2026

| Gap | State | Resolve by |
| --- | --- | --- |
| Idea | Closed: owner selected Arc Lab on 10 Oct | — |
| Do reviewers fund education/tooling labs? | Unknown; no recipients announced; owner accepted the risk by selecting | — |
| Deployer funding and key | Wallet logged above; unfunded; `.env.local` created from the example, key line empty. Needed: testnet USDC (faucet.circle.com), then a few mainnet USDC | Owner, before testnet deploy |
| Mainnet spend estimate | Testnet dry run of `script/Deploy.s.sol` (10 Oct 19:15 UTC, simulation only): 4,108,837 gas for 3 deployments + float + 2 `addChallenge` (≈0.082 USDC at the 20 gwei floor; the earlier 1.5–3M guess was low). Plus 0.05 USDC drip per learner and 0.0001 USDC checker float. Not yet a mined result | Measure on testnet broadcast |
| Testnet broadcast blocked | The Claude Code auto-mode classifier denied `--broadcast` as a production deploy (10 Oct 19:16 UTC) | Owner runs the command or allows it |
| Browser SLH-DSA signing time | Untested in a browser (≈2 s in Node) | Web page build |
| Arc Foundry | Closed: v0.8.0-2 installed in WSL with owner's yes; tests run on the Arc EVM (E15) | — |
| CI contract job | Added (installs Arc Foundry from the checksummed archive); never run on GitHub | First push of `arc-lab` |
| Source license | Contracts marked `UNLICENSED` | Owner, before going public |
| External-model critique of the chosen idea | Not run (HF out of credit, GitHub Models blocked locally, `claude` CLI login expired) | Before freeze |
| Real learners for the lab | None recruited | 12 October |
| Circle Gas Station on Arc mainnet works as documented | Docs say supported; not tested | Only if a sponsorship feature is built |
| Number of grants already awarded | Not visible anywhere | Submit early regardless |

| Rank | Risk / gap | Consequence | Resolution |
| --- | --- | --- | --- |
| 1 | Underestimating the remaining time and mainnet rollout | A good concept remains local/testnet-only and is ineligible | Select one narrow result; falsify feasibility early; retain deployment and verification buffer |
| 2 | Private repo conflicts with the public-source requirement | Current visibility cannot satisfy submission | Owner later chooses whether to publish a reviewed submission repo or obtain an organizer exception; private reviewer access is not assumed acceptable |
| 3 | No selected idea or concrete beneficiary | There is no product to build or judge | Complete the PRD; compare against the status quo; owner selects |
| 4 | Wallet, USDC funding, and permitted spending unset | Mainnet deployment/transactions cannot be planned responsibly | Owner identifies compatible wallet, funding route, and spending ceiling; no recovery material in the repo |
| 5 | Incorrect Arc amount/event semantics | Wrong accounting or misleading transaction evidence | Verify native/ERC-20 units and event sources; add relevant assertions for the selected flow |
| 6 | Unknown service/data access and cost | Demo depends on inaccessible or unaffordable infrastructure | Verify the actual needed API, permissions, quotas, and payer before selecting dependencies |
| 7 | Hosted demo or RPC failure | Reviewers cannot observe the result | Rehearse exact journey; report failures honestly; retain clearly labeled recorded evidence |
| 8 | Unverified reuse and participant declarations | Rights or eligibility cannot be asserted | Check licenses and program declarations with the owner; distinguish verified facts from assumptions |

## Open questions

| Question | Current answer | Resolve before |
| --- | --- | --- |
| Project idea, name, scope, stack | Pending owner selection | Feature implementation |
| Team and actual available hours | Unknown | Final build plan |
| Hosting/API/mainnet budget | Unknown | Paid services or transactions |
| AI-assistance policy | Not specified on the detail page | Submission declarations / AI-dependent plan |
| Age/team-size limits or further form terms | Not specified on the detail page | Eligibility assertions and submission |
| Public-source strategy and license | Pending; keep this repo private now | Submission |
| Required video or extra form fields | Detail page lists no mandatory video; form not inspected | Submission preparation |

## Evidence still absent

No application tests, testnet project, mainnet project, public demo, deployment receipt, user evidence, or submission confirmation exists. Repository checks and read-only RPC observations cannot fill these gaps. See [STATUS](docs/STATUS.md) and [SUBMISSION](docs/SUBMISSION.md).
