# Submission preparation

Status: **not ready; not submitted.** Source: [official Arc Microgrants page](https://dorahacks.io/hackathon/arc-microgrants/detail), checked 10 October 2026. Deadline: **15 October 2026, 03:59 UTC / 09:29 IST**; target 13 October (IST). The owner submits from their own account.

## Required artifacts

- [x] Working Arc **mainnet** deployment and a reviewer-accessible link: contracts deployed and source verified (E25), [page](https://arc-lab-lemon.vercel.app) defaults to mainnet (E26). A mainnet learner journey is still to be run.
- [ ] Public source repository. [Harshyadav442277/microgrants](https://github.com/Harshyadav442277/microgrants) is private; owner decides, and picks a license first.
- [x] Short description of what the project does and why it uses Arc (draft below).
- [ ] Public builder profile: GitHub, X, or Farcaster (owner).
- [ ] Owner confirms submission rights and eligibility declarations.
- [ ] Owner confirms the project has not already received Circle/Arc funding.

## Draft description fields

| Field | Draft |
| --- | --- |
| Project title | Arc Lab |
| One line | Graded challenges on the things Arc does differently from Ethereum, checked by contracts on Arc. |
| What it does | Each challenge is one Arc behaviour. A learner deploys the deliberately wrong starter contract from the page, submits it, and reads why the checker contract failed it; then fixes it in their own tools and submits again. The checker grades the deployment on Arc and the registry records PASS or FAIL as an on-chain event that anyone can verify. An instructor enrols a class, and each enrolled learner receives 0.1 USDC for gas, so a learner can start with no USDC. |
| Challenges | **Books that balance**: native USDC (18 decimals) and the USDC token (6 decimals) are one balance; a token transfer credits a contract without running its code, and the token view floors dust. **Post-quantum signature**: the learner signs with their own SLH-DSA-SHA2-128s key in the browser and deploys a verifier that must use Arc's precompile. |
| Why Arc | Both checkers rely on behaviour only Arc has: the shared 18/6-decimal USDC balance and the SLH-DSA verifier precompile. On another chain neither checker can run. |
| Who it is for | University blockchain clubs and Arc workshops that want a hands-on exercise with a result that can be checked. |
| Live deployment URL | https://arc-lab-lemon.vercel.app (Arc mainnet; `?network=testnet` for the rehearsal) |
| Contracts | Arc mainnet and testnet, same addresses: registry `0x6789b2C87Af7A524A805C6bA234236f5F5E54Aa1`, checkers `0x73a3c3FA009767E8515F39E852764bdcdBBa540a` and `0x54db435c807a89A2cC1209012431C465dd541323`; source verified (mainnet on Sourcify) |
| Public source URL | https://github.com/Harshyadav442277/microgrants |
| Builder profile | Owner to choose |
| Verification | 25 contract tests on the Arc EVM (Arc Foundry, testnet fork, no mocks) passing locally and in GitHub Actions; mainnet `eth_call` simulation; Playwright journey through the page on Arc testnet |
| Limits to state | Every learner so far is a builder-controlled test wallet, labelled as such on the board. Tested in Chromium through a wallet bridge, not yet with MetaMask or on a phone. Public Arc RPC and explorer rate-limit bursts; the page backs off and falls back. |

## Before submitting

- [x] Mainnet: deploy, verify source (Sourcify), add to `config/deployments.json`, redeploy the page (E25, E26).
- [ ] Mainnet: owner funds the registry and runs one learner journey with MetaMask; record hashes in [EVIDENCE](EVIDENCE.md).
- [x] Repository: public content reviewed, MIT license added (owner approved making it public, 12 Oct IST).
- [ ] Manual check with a real browser wallet (MetaMask) on the hosted page.
- [ ] Re-read the live program page for changed rules and form fields.

## Submission evidence

An account page, draft, registration, or clicked button is not a submitted entry. After the owner submits, record the visible confirmation, entry URL, submission time and deployed revision in [STATUS](STATUS.md) and [EVIDENCE](EVIDENCE.md).

Selected recipients may need private payout verification and an Arc-compatible wallet. Do not store verification documents or recovery credentials in this repository.
