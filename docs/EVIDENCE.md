# Evidence ledger

Keep planned work separate from observed results. Use the checked date and exact revision where meaningful. A passing repository check does not prove a deployed application.

| ID | Date | Claim / check | Source or command | Observation | Limit |
| --- | --- | --- | --- | --- | --- |
| E01 | 2026-10-08 | Program requirements | [DoraHacks detail page](https://dorahacks.io/hackathon/arc-microgrants/detail), read in browser | Mainnet, public source, description, public profile required; deadline 14 Oct 23:59 ET | Form-specific terms not inspected; requirements may change |
| E02 | 2026-10-08 | Public network configuration | [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc) | Mainnet 5042; testnet 5042002; `.io` RPC/explorer endpoints | Published configuration; not project deployment evidence |
| E03 | 2026-10-08 | Repository creation | `gh repo create ... --private` | GitHub returned the new repo URL | Recheck private visibility with authenticated metadata |

## Add after checking

Record `npm ci`, repository checks, RPC results, and local commit verification after running them. Later add feasibility experiments, meaningful tests, fresh-checkout results, deployed revisions, receipts, hosted user-journey verification, and submission confirmation.

For every new row, include actual observed output, success/failure, and practical limits. Preserve failures and unresolved questions. Avoid claiming a model metric, user outcome, transaction result, or grant status from a plan or screenshot of an intermediate step.
