# Build phases

Deadline: **15 October 2026, 09:29 IST**. Dates below are internal targets as of 8 October; they are not organizer milestones. Replan using actual team hours once an idea is selected.

| Phase | Deliverable | Exit gate | Current state |
| --- | --- | --- | --- |
| 0. Preparation | Private repo, verified requirements, neutral tooling and documentation | Local checks pass; owner reviews scaffold | Awaiting review |
| 1. Idea and feasibility | Filled PRD, status quo, criterion mapping, smallest experiment | Owner selects idea; evidence supports feasibility | Not started |
| 2. Narrow implementation | One complete core journey and needed Arc integration | Meaningful tests and local demo pass | Not started |
| 3. Testnet rehearsal | End-to-end journey on the intended wallet/contract/service setup | Exact outputs and relevant failure cases verified | Not started |
| 4. Mainnet and hosting | Working reviewer-accessible deployment | Owner sets budget and rollout scope; mainnet results verified | Not started |
| 5. Evidence and submission | Clean public-source plan, reproducible demo, accurate program entry | Owner resolves visibility/declarations and submits; confirmation retained | Not started |

## Proposed working targets

- **8-9 October:** review preparation, select the idea, and run the decisive feasibility experiment.
- **9-12 October:** build and rehearse the smallest useful result; shrink scope when a dependency blocks progress.
- **12 October, 18:00 IST:** provisional feature freeze, leaving time for mainnet verification, fresh-checkout checks, and submission preparation. Aim to freeze features after roughly 70% of available build time.
- **13-14 October:** verify hosted behavior, correct docs, collect receipts and demo evidence, resolve public-source requirements.
- **14 October, 18:00 IST:** internal submission target with buffer before the official next-morning cutoff.

If idea selection is delayed, cut features before cutting verification. Do not count this schedule as a promise of completion or assume any available hours or budget.

## Current review gate

The private GitHub repository can exist empty during review. Local commits are allowed; uploading the scaffold waits for the owner's review. Keep one `main` branch and push only reviewed files. Publishing source, executing mainnet transactions, and submitting an entry require their own owner decisions.

Progress and evidence live in [STATUS](docs/STATUS.md), [GAPS](GAPS.md), and [EVIDENCE](docs/EVIDENCE.md).
