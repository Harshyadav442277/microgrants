// Runs the learner journey as real transactions: the instructor enrols a learner (who receives the drip),
// then the learner, paying gas only from the drip, deploys and submits a correct solution to each challenge,
// then one wrong solution each. Prints every transaction and the recorded result.
//
// Usage: node --env-file=.env.local scripts/run-journey.mjs [--network=testnet] [--out=<forge out dir>]
// Env: DEPLOYER_PRIVATE_KEY (registry owner), LEARNER_PRIVATE_KEY (learner wallet).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient, createWalletClient, http, parseAbi, encodeAbiParameters, formatUnits, decodeEventLog,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { slh_dsa_sha2_128s as slh } from '@noble/post-quantum/slh-dsa.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const networkName = arg('network') ?? 'testnet';
const outDir = arg('out') ?? process.env.FOUNDRY_OUT ?? path.join(root, 'contracts', 'out');

const networks = JSON.parse(await readFile(path.join(root, 'config/arc-networks.json'), 'utf8')).networks;
const deployment = JSON.parse(await readFile(path.join(root, 'config/deployments.json'), 'utf8'))[networkName];
const network = networks[networkName];
if (!network || !deployment) throw new Error(`No ${networkName} network or deployment configured.`);
const chain = {
  id: network.chainId, name: network.name, nativeCurrency: network.nativeCurrency,
  rpcUrls: { default: { http: [network.rpcUrl] } },
};
const transport = http(network.rpcUrl);
const client = createPublicClient({ chain, transport });
if ((await client.getChainId()) !== network.chainId) throw new Error('RPC is on the wrong chain.');

for (const key of ['DEPLOYER_PRIVATE_KEY', 'LEARNER_PRIVATE_KEY']) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(process.env[key] ?? '')) throw new Error(`${key} missing or malformed in .env.local`);
}
const instructor = createWalletClient({ chain, transport, account: privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY) });
const learner = createWalletClient({ chain, transport, account: privateKeyToAccount(process.env.LEARNER_PRIVATE_KEY) });
const me = learner.account.address;

const registryAbi = parseAbi([
  'function enrol(address[] learners)',
  'function enrolled(address) view returns (bool)',
  'function solved(address, uint256) view returns (bool)',
  'function submit(uint256 id, address solution, bytes data) returns (bool passed, uint8 code)',
  'event Enrolled(address indexed learner, uint256 dripWei)',
  'event DripFailed(address indexed learner)',
  'event Submitted(address indexed learner, uint256 indexed id, address solution, bool passed, uint8 code)',
]);
const pqAbi = parseAbi(['function message(address learner) view returns (bytes)']);
const CODES = [
  ['OK', 'DEPOSIT_FAILED', 'WRONG_TOTAL', 'WITHDRAW_FAILED', 'LEFT_DUST', 'PAID_WRONG', 'ABORTED'],
  ['OK', 'BAD_INPUT', 'BAD_SIGNATURE', 'REJECTED_VALID', 'ACCEPTED_TAMPERED'],
];
const artifact = async (name) =>
  JSON.parse(await readFile(path.join(outDir, 'Solutions.sol', `${name}.json`), 'utf8'));
const usdc = (wei) => `${formatUnits(wei, 18)} USDC`;
const explorerTx = (hash) => `${network.explorerUrl}/tx/${hash}`;
const balance = () => client.getBalance({ address: me });

async function receipt(label, hash) {
  const r = await client.waitForTransactionReceipt({ hash });
  const cost = r.gasUsed * r.effectiveGasPrice;
  console.log(`  ${r.status === 'success' ? 'ok ' : 'REVERTED'} ${label.padEnd(30)} gas ${String(r.gasUsed).padStart(8)}  ${usdc(cost).padEnd(26)} ${explorerTx(hash)}`);
  if (r.status !== 'success') throw new Error(`${label} reverted`);
  return r;
}

async function deploy(name) {
  const a = await artifact(name);
  const hash = await learner.deployContract({ abi: a.abi, bytecode: a.bytecode.object, args: [me] });
  const r = await receipt(`deploy ${name}`, hash);
  return r.contractAddress;
}

async function submit(id, solution, data, label) {
  const hash = await learner.writeContract({
    address: deployment.registry, abi: registryAbi, functionName: 'submit', args: [BigInt(id), solution, data],
  });
  const r = await receipt(`submit ${label}`, hash);
  for (const log of r.logs) {
    try {
      const ev = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics });
      if (ev.eventName === 'Submitted') {
        console.log(`  → recorded on-chain: ${ev.args.passed ? 'PASS' : 'FAIL'} ${CODES[id][ev.args.code]}`);
        return ev.args;
      }
    } catch { /* other events */ }
  }
  throw new Error('No Submitted event');
}

console.log(`${network.name} · registry ${deployment.registry} · learner ${me}`);
console.log(`learner balance before: ${usdc(await balance())}`);

console.log('\n1. Instructor enrols the learner');
if (await client.readContract({ address: deployment.registry, abi: registryAbi, functionName: 'enrolled', args: [me] })) {
  console.log('  already enrolled; no new drip');
} else {
  const hash = await instructor.writeContract({
    address: deployment.registry, abi: registryAbi, functionName: 'enrol', args: [[me]],
  });
  await receipt('enrol', hash);
}
console.log(`  learner balance: ${usdc(await balance())}`);

console.log('\n2. Books that balance — correct vault');
const good = await deploy('GoodVault');
await submit(0, good, '0x', 'GoodVault');

console.log('\n3. Post-quantum signature — learner signs with a new SLH-DSA key, deploys a verifier');
const checker = deployment.challenges[1].checker;
const message = await client.readContract({ address: checker, abi: pqAbi, functionName: 'message', args: [me] });
const { publicKey, secretKey } = slh.keygen(crypto.getRandomValues(new Uint8Array(48)));
const t0 = Date.now();
const sig = slh.sign(Buffer.from(message.slice(2), 'hex'), secretKey);
console.log(`  signed ${message.length / 2 - 1}-byte message in ${Date.now() - t0} ms; signature ${sig.length} bytes`);
const pqData = encodeAbiParameters([{ type: 'bytes' }, { type: 'bytes' }], [
  `0x${Buffer.from(publicKey).toString('hex')}`, `0x${Buffer.from(sig).toString('hex')}`,
]);
const verifier = await deploy('GoodVerifier');
await submit(1, verifier, pqData, 'GoodVerifier');
console.log(`  learner balance after both PASSes: ${usdc(await balance())}`);

console.log('\n4. Wrong solutions are graded too');
try {
  const ledger = await deploy('LedgerVault');
  await submit(0, ledger, '0x', 'LedgerVault');
  const yes = await deploy('YesVerifier');
  await submit(1, yes, pqData, 'YesVerifier');
} catch (e) {
  console.log(`  stopped: ${e.shortMessage ?? e.message}`);
}

const solved = await Promise.all([0n, 1n].map((id) =>
  client.readContract({ address: deployment.registry, abi: registryAbi, functionName: 'solved', args: [me, id] })));
console.log(`\nsolved on-chain: Books that balance=${solved[0]}, Post-quantum signature=${solved[1]}`);
console.log(`learner balance after: ${usdc(await balance())}`);
