# Gaps and ranked risks

Last updated: **8 October 2026**. Idea selection remains with the owner. This list names blockers rather than treating scaffold completion as grant eligibility.

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
