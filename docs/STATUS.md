# Project status

Updated: **8 October 2026**.

| Area | State | Evidence / next step |
| --- | --- | --- |
| Idea | Not selected | Owner decides later; complete [PRD](../PRD.md) after selection |
| Requirements | Detail page verified | [RULES](../RULES.md); recheck before submission |
| Local repository | Initialized on `main` | Scaffold prepared for owner review |
| GitHub repository | Created private | [Harshyadav442277/arc-microgrants](https://github.com/Harshyadav442277/arc-microgrants) |
| Upload | Waiting for owner review | No scaffold files pushed |
| Tooling checks | Pending final verification | Run `npm ci`, `npm run check`, and whitespace checks |
| Live RPC diagnostics | Pending optional verification | Read-only probes do not imply a product deployment |
| GitHub Actions | Not run | Workflow will be uploaded with the approved scaffold |
| Application / contracts | Not implemented | Reserved folders only |
| Local product tests | Not run | No product exists yet |
| Testnet product | Not deployed | Rehearse after implementation |
| Mainnet product | Not deployed | Needs idea, tested implementation, wallet, and budget |
| Public demo | None | Requires deployment |
| Submission | Not submitted | [Checklist](SUBMISSION.md) remains open |
| Public-source requirement | Unresolved | Keep repo private now; later owner decision required |

## Decisions already established

- Keep the preparation repo private.
- Let the owner decide the project idea later.
- Prepare locally for review before pushing.
- Use one `main` branch and a framework-neutral scaffold.
- Separate scaffold checks, live RPC observations, application behavior, deployment, and submission evidence.

## Next action

Owner reviews [README](../README.md), [RULES](../RULES.md), and planning documents. After review, the scaffold can be pushed to the existing private remote. Select the idea separately; update the documents before implementing features.
