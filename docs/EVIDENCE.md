# Evidence ledger

Keep planned work separate from observed results. Use the checked date and exact revision where meaningful. A passing repository check does not prove a deployed application.

| ID | Date | Claim / check | Source or command | Observation | Limit |
| --- | --- | --- | --- | --- | --- |
| E01 | 2026-10-08 | Program requirements | [DoraHacks detail page](https://dorahacks.io/hackathon/arc-microgrants/detail), read in browser | Mainnet, public source, description, public profile required; deadline 14 Oct 23:59 ET | Form-specific terms not inspected; requirements may change |
| E02 | 2026-10-08 | Public network configuration | [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc) | Mainnet 5042; testnet 5042002; `.io` RPC/explorer endpoints | Published configuration; not project deployment evidence |
| E03 | 2026-10-08 | Repository creation and visibility | `gh repo create ... --private`; authenticated `gh api repos/Harshyadav442277/arc-microgrants` and branch listing | At creation: `private=true`, `visibility=private`, `size=0`, zero branches | Historical pre-upload observation; see E10 for push verification |
| E04 | 2026-10-08 | Local scaffold checks | `npm ci --ignore-scripts --no-audit --no-fund`; `npm run check`; staged `git diff --cached --check` | All exited 0; `Repository checks passed.` | Document/configuration hygiene and syntax only; credential detection is limited |
| E05 | 2026-10-08 | Fresh local checkout | Local clone of `948e7748478131272c24c6275a8db4809f6e95e3`; `npm ci`, `npm run check`, `git diff --check`, `git status --short` | All passed; clone working tree clean | Local clone, not a GitHub clone; no application exists |
| E06 | 2026-10-08 | Testnet RPC observation | `npm run check:arc -- --network=testnet` | Chain ID 5042002; block 66163673; exit 0 | Point-in-time read-only observation; no project deployed |
| E07 | 2026-10-08 | Mainnet RPC observation | `npm run check:arc -- --network=mainnet` | Chain ID 5042; block 24928493; exit 0 | Point-in-time read-only observation; no signing or spending |
| E08 | 2026-10-08 | Network guard behavior | Invalid network argument; mainnet selected with testnet RPC override | Both rejected with exit 1 | Checks identity/input; not a transaction safety test |
| E09 | 2026-10-08 | Ignore rules | `git check-ignore` for local env, continuity notes, assistant files, local artifacts, and secret path | All sample paths ignored; local `MEMORY.md` absent from tracked files | Ignore rules do not remove already-tracked secrets or inspect all possible credential formats |
| E10 | 2026-10-08 | Authorized scaffold upload | `git push --set-upstream origin main`; authenticated GitHub commit and visibility reads | GitHub `main` matched local `cb1043af8ad1e7d4dd1d5c2d250cbf12df04b4c7`; repository remained private | This verifies source upload, not application deployment or program submission |

## Continue after idea selection

Add feasibility experiments, meaningful tests, fresh-checkout product results, deployed revisions, receipts, hosted user-journey verification, and submission confirmation when they actually occur. Check [GitHub Actions](https://github.com/Harshyadav442277/arc-microgrants/actions) for hosted results at each revision; the local check results above do not establish hosted CI success.

For every new row, include actual observed output, success/failure, and practical limits. Preserve failures and unresolved questions. Avoid claiming a model metric, user outcome, transaction result, or grant status from a plan or screenshot of an intermediate step.
