# Demo and verification runbook

Status: **scaffold verification only**. The product journey will be written after idea selection. These checks do not demonstrate a submission-eligible application.

## Reproduce the scaffold locally

Open a terminal in the repository with Node.js 24.x and Git available.

| Step | Command | Expected result |
| --- | --- | --- |
| 1 | `node --version` | `v24.x.x` |
| 2 | `npm ci` | Exit 0; installs no third-party dependencies |
| 3 | `npm run check` | Exit 0; final line `Repository checks passed.` |
| 4 | `git diff --check` | Exit 0; no whitespace-error output |

`npm ci` can need npm's normal local cache/runtime setup; the actual repository checker makes no network calls. GitHub Actions runs the same offline checker after upload. A workflow file is not evidence of a successful hosted CI run.

## Optional live RPC diagnostics

```sh
npm run check:arc -- --network=testnet
npm run check:arc -- --network=mainnet
```

Expected successful final line:

```text
Arc testnet RPC verified: chainId=5042002; block=<current block>.
Arc mainnet RPC verified: chainId=5042; block=<current block>.
```

The block varies. Each command times out or exits nonzero on unavailable RPC, invalid responses, or mismatched chain ID. A failed diagnostic is an availability/configuration observation, not a failed application transaction. These commands never sign or broadcast.

## Future product demo contract

Fill the following before feature freeze. Use exact input, expected values, and observable states.

| Step | User action / input | Expected output | Evidence |
| --- | --- | --- | --- |
| Open the hosted interface | Pending idea/deployment | Ready state and correct network | Pending |
| Perform the one useful task | Pending PRD | Exact useful result | Pending |
| Verify Arc contribution | Pending architecture | Correct mainnet state/receipt/read | Pending |
| Exercise a relevant failure | Pending design | Actionable error without false success | Pending |

Keep the complete journey short enough to repeat. For a web product, verify it end to end in a real browser; add Playwright coverage only for meaningful behavior. For contracts, verify access, value accounting, and relevant failure paths.

## Fresh checkout and outage rehearsal

Before submission, reproduce setup and the complete journey from a clean checkout using documented versions and `.env.example`. Keep credentials outside the clone and record required funding/services. An offline or recorded walkthrough must be explicitly labeled; it can explain the result during outages but cannot replace the program's live mainnet requirement.

Record each check, revision, observed output, and limitation in [EVIDENCE](docs/EVIDENCE.md). Do not present planned tests or a recording as current live functionality.
