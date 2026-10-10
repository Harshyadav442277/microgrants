// Grades the sample solutions on a live Arc network without sending a transaction or holding a key.
// The MainnetScenario constructor runs inside eth_call from a throwaway sender with a balance override,
// so real Arc USDC and the real SLH-DSA precompile do the work. Nothing is deployed and no gas is paid.
//
// Usage: arc-forge build (in contracts/), then
//   node scripts/simulate-mainnet.mjs [--network=mainnet|testnet] [--out=<forge out dir>]
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient, http, encodeDeployData, decodeAbiParameters, encodePacked, getContractAddress, toHex,
} from 'viem';
import { slh_dsa_sha2_128s as slh } from '@noble/post-quantum/slh-dsa.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const networkName = arg('network') ?? 'mainnet';
const outDir = arg('out') ?? process.env.FOUNDRY_OUT ?? path.join(root, 'contracts', 'out');

const config = JSON.parse(await readFile(path.join(root, 'config/arc-networks.json'), 'utf8'));
const network = config.networks[networkName];
if (!network) throw new Error('Select --network=mainnet or --network=testnet.');
const client = createPublicClient({ transport: http(network.rpcUrl) });
const chainId = await client.getChainId();
if (chainId !== network.chainId) throw new Error(`RPC chain ${chainId} is not ${network.name}.`);

const artifact = JSON.parse(await readFile(path.join(outDir, 'MainnetScenario.sol', 'MainnetScenario.json'), 'utf8'));
const CODES = {
  0: ['OK', 'DEPOSIT_FAILED', 'WRONG_TOTAL', 'WITHDRAW_FAILED', 'LEFT_DUST', 'PAID_WRONG', 'ABORTED'],
  1: ['OK', 'BAD_INPUT', 'BAD_SIGNATURE', 'REJECTED_VALID', 'ACCEPTED_TAMPERED'],
};

// Fresh random sender: nonce 0, so every created address is predictable.
const sender = toHex(crypto.getRandomValues(new Uint8Array(20)));
const scenario = getContractAddress({ from: sender, nonce: 0n });
const pqChecker = getContractAddress({ from: scenario, nonce: 3n });

// The learner (here the scenario contract) signs the challenge message with a new SLH-DSA key.
const message = encodePacked(
  ['string', 'uint256', 'address', 'address'],
  ['Arc Lab post-quantum challenge', BigInt(chainId), pqChecker, scenario],
);
const { publicKey, secretKey } = slh.keygen(crypto.getRandomValues(new Uint8Array(48)));
const sig = slh.sign(Buffer.from(message.slice(2), 'hex'), secretKey);

const data = encodeDeployData({
  abi: artifact.abi, bytecode: artifact.bytecode.object, args: [toHex(publicKey), toHex(sig)],
});
const block = await client.getBlockNumber();
const value = 10n ** 14n;
const result = await client.request({
  method: 'eth_call',
  params: [
    { from: sender, data, value: toHex(value), gas: toHex(30_000_000n) },
    toHex(block),
    { [sender]: { balance: toHex(10n ** 18n) } },
  ],
});

const [rows, pqAddress, floatIntact, vaultEmpty, vaultSolved, pqSolved] = decodeAbiParameters(
  [
    { type: 'tuple[]', components: [
      { name: 'solution', type: 'string' }, { name: 'passed', type: 'bool' },
      { name: 'code', type: 'uint8' }, { name: 'gasUsed', type: 'uint256' },
    ] },
    { type: 'address' }, { type: 'bool' }, { type: 'bool' }, { type: 'bool' }, { type: 'bool' },
  ],
  result,
);
if (pqAddress.toLowerCase() !== pqChecker.toLowerCase()) throw new Error('Predicted checker address was wrong.');

const gasPrice = await client.getGasPrice();
console.log(`${network.name} (chain ${chainId}), block ${block}, gas price ${gasPrice} wei — eth_call only, nothing sent`);
for (const [i, row] of rows.entries()) {
  const challenge = i < 3 ? 0 : 1;
  const cost = Number(row.gasUsed * gasPrice) / 1e18;
  console.log(
    `${['vault', 'pq'][challenge].padEnd(5)} ${row.solution.padEnd(16)} ${row.passed ? 'PASS' : 'FAIL'} ` +
    `${CODES[challenge][row.code].padEnd(18)} gas ${String(row.gasUsed).padStart(9)} ≈ ${cost.toFixed(6)} USDC`,
  );
}
console.log({ floatIntact, vaultEmpty, vaultSolved, pqSolved });

const expected = [[true, 0], [false, 2], [false, 4], [true, 0], [true, 0], [false, 4], [false, 4]];
const ok = rows.every((r, i) => r.passed === expected[i][0] && r.code === expected[i][1]) &&
  floatIntact && vaultEmpty && vaultSolved && pqSolved;
console.log(ok ? 'Simulation matches expectations.' : 'Simulation DOES NOT match expectations.');
process.exitCode = ok ? 0 : 1;
