# Arc setup reference

Checked **8 October 2026** against [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc). Values are stored in [network configuration](../config/arc-networks.json). Recheck the official reference before implementing or deploying.

| Network | Chain ID | Public RPC | Explorer | Gas currency |
| --- | --- | --- | --- | --- |
| Mainnet | 5042 | `https://rpc.mainnet.arc.io` | [Arc Explorer](https://explorer.arc.io) | USDC |
| Testnet | 5042002 | `https://rpc.testnet.arc.io` | [Arc Testnet Explorer](https://explorer.testnet.arc.io) | Test USDC |

Use testnet for development and rehearsal; the grant submission requires mainnet. The [Circle faucet](https://faucet.circle.com) provides testnet funds, not mainnet deployment funding.

## Scaffold configuration

The RPC checker defaults to testnet. It reads the public configuration file and optionally uses `ARC_RPC_URL` from the process environment. It does not automatically load `.env`, choose a wallet, or install a wallet library.

An optional local setup on Node 24:

```sh
node --env-file=.env scripts/check-arc.mjs
```

Create `.env` from [.env.example](../.env.example) only if an override is needed. When switching to mainnet, update both `ARC_NETWORK` and any `ARC_RPC_URL` override. The checker rejects an endpoint whose reported chain ID does not match the selected network. Never paste wallet credentials into `.env.example`.

## Implementation details that matter later

According to [EVM differences](https://docs.arc.io/arc/references/evm-differences), native USDC uses **18 decimal places** and the ERC-20 interface uses **6**; both represent the same underlying balance. Do not sum them as different assets. Determine which interface each call and event uses, and retain appropriate precision in accounting. Obtain token addresses from the current [contract-address reference](https://docs.arc.io/arc/references/contract-addresses).

The [gas reference](https://docs.arc.io/arc/references/gas-and-fees) documents a `maxFeePerGas` floor of **20 Gwei**. Fetch current fee data and estimate the exact call before spending. Public RPC liveness alone does not establish that an application transaction will succeed.

Read [USDC system events](https://docs.arc.io/arc/references/usdc-system-events) before implementing a payment-history/indexing feature. Native and ERC-20 event sources require explicit interpretation to avoid double counting.

## Official starting points

- [Arc documentation](https://docs.arc.io/)
- [Documentation index](https://docs.arc.io/llms.txt)
- [Install Arc Foundry](https://docs.arc.io/arc/tutorials/install-arc-foundry)
- [Deploy on Arc](https://docs.arc.io/arc/tutorials/deploy-on-arc)
- [Reference applications](https://docs.arc.io/arc/references/sample-applications)
- [Arc community](https://www.arc.io/community)

These are references, not installed integrations. Select and pin tools only after the idea establishes a need. Keep all wallet recovery material and signing secrets outside version control. No deployment or financial operation is part of this scaffold.
