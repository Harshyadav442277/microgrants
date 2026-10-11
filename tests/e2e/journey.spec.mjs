// The complete journey through the real page, as real Arc testnet transactions:
// the instructor enrols a brand-new learner from the page; the learner, holding only the drip, deploys each
// starter from the page, gets FAIL with the explanation, deploys a fixed contract and gets PASS; the results
// board then shows the learner. The page's window.ethereum is bridged to Node, where viem signs with test keys,
// so no key enters the browser. Fixed contracts are deployed from Node, standing in for the learner's Remix.
//
// Run: node --env-file=.env.local node_modules/@playwright/test/cli.js test
// Needs DEPLOYER_PRIVATE_KEY (registry owner, funded on testnet) and the compiled solutions (FOUNDRY_OUT).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createPublicClient, createWalletClient, http, parseAbi, toHex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const networks = JSON.parse(readFileSync('config/arc-networks.json', 'utf8')).networks;
const dep = JSON.parse(readFileSync('config/deployments.json', 'utf8')).testnet;
const net = networks.testnet;
const chain = { id: net.chainId, name: net.name, nativeCurrency: net.nativeCurrency, rpcUrls: { default: { http: [net.rpcUrl] } } };
const pub = createPublicClient({ chain, transport: http(net.rpcUrl, { retryCount: 6, retryDelay: 1000 }) });
const forgeOut = process.env.FOUNDRY_OUT ?? 'contracts/out';
const artifact = (name) => JSON.parse(readFileSync(path.join(forgeOut, 'Solutions.sol', `${name}.json`), 'utf8'));

// Records each RPC method the bridge sends, so a failure shows which call the node refused.
const trace = [];
const traced = http(net.rpcUrl, {
  retryCount: 6,
  retryDelay: 1000,
  onFetchRequest: async (req) => {
    try {
      const body = await req.clone().json();
      trace.push([body].flat().map((b) => b.method).join('+'));
    } catch { /* not JSON */ }
  },
});

async function attachWallet(page, account) {
  const wallet = createWalletClient({ chain, transport: traced, account });
  let approved = false; // like a real wallet: no accounts until the user connects
  const handle = async (method, params) => {
    switch (method) {
      case 'eth_requestAccounts':
        approved = true;
        return [account.address];
      case 'eth_accounts':
        return approved ? [account.address] : [];
      case 'eth_chainId':
        return toHex(chain.id);
      case 'wallet_switchEthereumChain':
      case 'wallet_addEthereumChain':
        return null;
      case 'eth_sendTransaction': {
        const [tx] = params;
        const base = {
          account,
          to: tx.to ?? undefined,
          data: tx.data ?? tx.input,
          value: tx.value ? BigInt(tx.value) : undefined,
        };
        // The public testnet RPC intermittently answers "Request exceeds defined limit"; retry as a wallet would.
        for (let attempt = 1; ; attempt++) {
          trace.length = 0;
          try {
            // Filling nonce, gas and fees here keeps viem from trying eth_fillTransaction, which Arc does not serve.
            const [nonce, gas, block] = await Promise.all([
              pub.getTransactionCount({ address: account.address, blockTag: 'pending' }),
              tx.gas ? BigInt(tx.gas) : pub.estimateGas(base).then((g) => (g * 12n) / 10n),
              pub.getBlock(),
            ]);
            const tip = 1_000_000_000n;
            return await wallet.sendTransaction({
              ...base, chainId: chain.id, nonce, gas,
              maxPriorityFeePerGas: tip, maxFeePerGas: block.baseFeePerGas * 2n + tip,
            });
          } catch (e) {
            console.error(`attempt ${attempt}: ${e.details ?? e.shortMessage} (code ${e.code ?? e.cause?.code}) after ${trace.join(' → ')}`);
            if (attempt === 4 || !/exceeds defined limit/i.test(`${e.details} ${e.message}`)) throw e;
            await new Promise((r) => setTimeout(r, 5000 * attempt));
          }
        }
      }
      default:
        return pub.request({ method, params });
    }
  };
  await page.exposeFunction('__arcLabRpc', async (method, params) => {
    try {
      return await handle(method, params);
    } catch (e) {
      console.error(`wallet bridge ${method} failed: ${e.shortMessage ?? e.message}
${e.details ?? ''}
params: ${JSON.stringify(params, (k, v) => (typeof v === 'string' && v.length > 80 ? `${v.slice(0, 20)}…(${v.length})` : v))}`);
      throw e;
    }
  });
  await page.addInitScript(() => {
    window.ethereum = { request: ({ method, params }) => window.__arcLabRpc(method, params ?? []), on() {} };
  });
}

// Every test learner is a builder-controlled wallet: record it before it transacts so the results board labels it.
function labelAsBuilder(address) {
  const all = JSON.parse(readFileSync('config/deployments.json', 'utf8'));
  all.testnet.builderWallets[address] = 'builder end-to-end test learner';
  writeFileSync('config/deployments.json', JSON.stringify(all, null, 2) + '\n');
}

async function deployFix(account, name) {
  const a = artifact(name);
  const wallet = createWalletClient({ chain, transport: traced, account });
  const hash = await wallet.deployContract({ abi: a.abi, bytecode: a.bytecode.object, args: [account.address] });
  return (await pub.waitForTransactionReceipt({ hash })).contractAddress;
}

test('a new learner completes both challenges from the page', async ({ browser }) => {
  test.skip(!process.env.DEPLOYER_PRIVATE_KEY, 'needs the funded instructor key in .env.local');
  const instructor = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
  const learner = privateKeyToAccount(generatePrivateKey());
  console.log(`learner ${learner.address}`);
  labelAsBuilder(learner.address);
  expect(await pub.getBalance({ address: learner.address })).toBe(0n);

  // Instructor enrols the learner from the instructor panel.
  const ip = await (await browser.newContext()).newPage();
  await attachWallet(ip, instructor);
  await ip.goto('/?network=testnet');
  await ip.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(ip.locator('#instructor')).toBeVisible();
  await ip.locator('#learners').fill(learner.address);
  await ip.getByRole('button', { name: 'Enrol and send gas' }).click();
  await expect(ip.locator('#enrol-result')).toContainText('Enrolled 1 of 1');

  // The learner opens the page holding only the drip.
  const lp = await (await browser.newContext()).newPage();
  await attachWallet(lp, learner);
  await lp.goto('/?network=testnet');
  await lp.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(lp.locator('#balance')).toContainText('0.1 native');

  // Books that balance: starter fails, fix passes.
  await lp.getByRole('button', { name: 'Deploy starter vault' }).click();
  await expect(lp.locator('[data-deploy-result="vault"]')).toContainText('Deployed at');
  await lp.locator('form[data-challenge="0"] button').click();
  await expect(lp.locator('[data-verdict="0"]')).toContainText('Fail: wrong total');
  await lp.locator('#addr-0').fill(await deployFix(learner, 'GoodVault'));
  await lp.locator('form[data-challenge="0"] button').click();
  await expect(lp.locator('[data-verdict="0"]')).toContainText('Pass');
  await expect(lp.locator('[data-status="0"]')).toHaveText('Solved');

  // Post-quantum signature: sign in the browser, starter fails, fix passes.
  await lp.getByRole('button', { name: 'Create key and sign' }).click();
  await expect(lp.locator('#sign-result')).toContainText('Signed in');
  console.log(`browser signing: ${await lp.locator('#sign-result').textContent()}`);
  await lp.getByRole('button', { name: 'Deploy starter verifier' }).click();
  await expect(lp.locator('[data-deploy-result="verifier"]')).toContainText('Deployed at');
  await lp.locator('form[data-challenge="1"] button').click();
  await expect(lp.locator('[data-verdict="1"]')).toContainText('Fail: tampered signature accepted');
  await lp.locator('#addr-1').fill(await deployFix(learner, 'GoodVerifier'));
  await lp.locator('form[data-challenge="1"] button').click();
  await expect(lp.locator('[data-verdict="1"]')).toContainText('Pass');
  await expect(lp.locator('[data-status="1"]')).toHaveText('Solved');

  // The public board and the chain agree.
  const row = lp.locator('#board tr', { hasText: `${learner.address.slice(0, 6)}…${learner.address.slice(-4)}` });
  await expect(row).toContainText('Solved');
  await expect(row.locator('td.pass')).toHaveCount(2);
  const solved = parseAbi(['function solved(address, uint256) view returns (bool)']);
  for (const id of [0n, 1n]) {
    expect(await pub.readContract({ address: dep.registry, abi: solved, functionName: 'solved', args: [learner.address, id] })).toBe(true);
  }
  console.log(`learner balance left: ${await pub.getBalance({ address: learner.address })} wei`);
});
