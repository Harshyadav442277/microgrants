import {
  createPublicClient, createWalletClient, custom, http, parseAbi, encodeAbiParameters, formatUnits, parseUnits,
  decodeEventLog, getAddress, isAddress, BaseError, ContractFunctionRevertedError,
} from 'viem';
import { slh_dsa_sha2_128s as slh } from '@noble/post-quantum/slh-dsa.js';
import networks from '../config/arc-networks.json';
import deployments from '../config/deployments.json';
import starters from './starters.json';

// ---------- network ----------
const available = Object.keys(deployments);
const requested = new URLSearchParams(location.search).get('network');
const netName = available.includes(requested) ? requested : available.includes('mainnet') ? 'mainnet' : available[0];
const net = networks.networks[netName];
const dep = deployments[netName];
const chain = {
  id: net.chainId,
  name: net.name,
  nativeCurrency: net.nativeCurrency,
  rpcUrls: { default: { http: [net.rpcUrl] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: net.explorerUrl } },
};
// The public Arc RPC rate-limits bursts (code -32005); back off for seconds, not milliseconds.
const pub = createPublicClient({ chain, transport: http(net.rpcUrl, { retryCount: 5, retryDelay: 1000 }) });
const builder = Object.fromEntries(Object.entries(dep.builderWallets ?? {}).map(([a, l]) => [a.toLowerCase(), l]));

const registryAbi = parseAbi([
  'function owner() view returns (address)',
  'function dripWei() view returns (uint256)',
  'function enrolled(address) view returns (bool)',
  'function solved(address, uint256) view returns (bool)',
  'function enrol(address[] learners) payable',
  'function submit(uint256 id, address solution, bytes data) returns (bool passed, uint8 code)',
  'event Enrolled(address indexed learner, uint256 dripWei)',
  'event DripFailed(address indexed learner)',
  'event Submitted(address indexed learner, uint256 indexed id, address solution, bool passed, uint8 code)',
  'error NotOwner()', 'error Reentrant()', 'error UnknownChallenge()', 'error NotAContract()',
  'error NoLearnerFunction()', 'error NotYourSolution()', 'error TransferFailed()',
]);
const usdcAbi = parseAbi(['function balanceOf(address) view returns (uint256)']);
const pqAbi = parseAbi(['function message(address learner) view returns (bytes)']);
const USDC = '0x3600000000000000000000000000000000000000';

// ---------- copy ----------
const VERDICTS = [
  [
    ['Pass', 'Your vault counted value that arrived without calling it, and paid out every wei.'],
    ['Fail: deposit() reverted', 'deposit() must be payable and accept the checker\'s deposit.'],
    ['Fail: wrong total', 'totalAssets() missed the token transfer. On Arc a USDC token transfer adds to your native balance without running your code, so a counter updated in deposit() never sees it. Report address(this).balance.'],
    ['Fail: withdrawAll() reverted', 'withdrawAll(to) must send everything the vault holds to to.'],
    ['Fail: dust left behind', 'withdrawAll() paid out through the token, whose balanceOf rounds down to 6 decimals, so the wei below 0.000001 USDC stayed in the vault. Send the native balance instead.'],
    ['Fail: wrong amount paid', 'The checker did not receive exactly what the vault held.'],
    ['Fail: check could not finish', 'The check stopped early, usually from running out of gas. Submit again; your wallet can raise the gas limit.'],
  ],
  [
    ['Pass', 'Your verifier accepted your signature and rejected a tampered copy.'],
    ['Fail: wrong input size', 'Use SLH-DSA-SHA2-128s: a 32-byte public key and a 7,856-byte signature. Create them in step 1.'],
    ['Fail: your signature is not valid', 'Arc\'s precompile rejected the signature itself, so your contract was not tested. Sign again in step 1 with the wallet you are submitting from.'],
    ['Fail: valid signature rejected', 'verify() returned false or reverted for a valid signature.'],
    ['Fail: tampered signature accepted', 'verify() returned true after one byte of the signature was changed. Checking lengths is not verification: call the precompile at 0x1800…0004.'],
  ],
];
const REVERTS = {
  NotYourSolution: 'That contract belongs to someone else: its learner() is not your address. Deploy your own with your address as the constructor argument.',
  NoLearnerFunction: 'That contract has no learner() function. Add one that returns your address.',
  NotAContract: 'There is no contract at that address on this network.',
  UnknownChallenge: 'This challenge is not listed in the registry.',
  NotOwner: 'Only the instructor\'s wallet can do this.',
};

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const txLink = (h, text = 'transaction') => `<a href="${net.explorerUrl}/tx/${h}" target="_blank" rel="noopener">${text}</a>`;
const addrLink = (a, text = short(a)) => `<a class="addr" href="${net.explorerUrl}/address/${a}" target="_blank" rel="noopener">${text}</a>`;
const usdc = (wei, digits = 6) => Number(formatUnits(wei, 18)).toFixed(digits);
const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function explain(err) {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    const name = revert?.data?.errorName;
    if (name && REVERTS[name]) return REVERTS[name];
    if (err.walk((e) => e.name === 'UserRejectedRequestError')) return 'You rejected the request in your wallet.';
    if (/insufficient funds|exceeds allowance|exceeds balance/i.test(err.message)) {
      return `Not enough USDC for gas. ${netName === 'testnet' ? 'Get test USDC at faucet.circle.com, or ask' : 'Ask'} your instructor to enrol you.`;
    }
    if (/exceeds defined limit|rate limit|too many requests/i.test(`${err.details} ${err.message}`)) {
      return `The Arc RPC refused the request for now (${err.details ?? 'limit'}). Wait a few seconds and try again.`;
    }
    return err.details ? `${err.shortMessage} ${err.details}` : err.shortMessage;
  }
  return err?.message ?? String(err);
}

// ---------- wallet ----------
const state = { account: null, wallet: null, signature: null, deployed: {} };

// Per-browser conveniences only; the page works the same when storage is blocked.
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; } },
  set(key, value) { try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked */ } },
};
const CONNECTED = 'arclab:connected';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// MetaMask mobile can inject window.ethereum after this script runs, answers eth_accounts with [] for a moment
// after load or after approving a connection, and reloads the page when it returns from a confirmation screen.
function waitForProvider(ms) {
  if (window.ethereum) return Promise.resolve(window.ethereum);
  return new Promise((resolve) => {
    const done = () => { clearInterval(poll); clearTimeout(timer); resolve(window.ethereum ?? null); };
    const poll = setInterval(() => window.ethereum && done(), 100);
    const timer = setTimeout(done, ms);
    window.addEventListener('ethereum#initialized', done, { once: true });
  });
}

async function currentAccount(tries) {
  for (let i = 1; ; i++) {
    const [account] = await window.ethereum.request({ method: 'eth_accounts' });
    if (account || i >= tries) return account ?? null;
    await sleep(500);
  }
}

async function connect() {
  if (!(await waitForProvider(1000))) {
    notice('No browser wallet found. Install one, such as MetaMask, to deploy and submit. You can still read the challenges and the results.');
    return;
  }
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  await useAccount(account ?? (await currentAccount(6)));
}

async function ensureChain() {
  const current = Number(await window.ethereum.request({ method: 'eth_chainId' }));
  if (current === net.chainId) return;
  const chainId = `0x${net.chainId.toString(16)}`;
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (e) {
    if (e.code !== 4902) throw e;
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{ chainId, chainName: net.name, nativeCurrency: net.nativeCurrency, rpcUrls: [net.rpcUrl], blockExplorerUrls: [net.explorerUrl] }],
    });
  }
}

async function useAccount(account) {
  if (!account) {
    state.account = state.wallet = null;
    render();
    return;
  }
  state.account = getAddress(account);
  state.wallet = createWalletClient({ account: state.account, chain, transport: custom(window.ethereum) });
  if (state.signature && state.signature.learner !== state.account) state.signature = null;
  store.set(CONNECTED, true);
  render();
  await Promise.all([refreshBalance(), refreshSolved(), refreshInstructor(), resumePending()]);
}

async function refreshBalance() {
  if (!state.account) return;
  const [wei, units] = await Promise.all([
    pub.getBalance({ address: state.account }),
    pub.readContract({ address: USDC, abi: usdcAbi, functionName: 'balanceOf', args: [state.account] }),
  ]);
  const el = $('#balance');
  el.hidden = false;
  el.textContent = `${usdc(wei, 4)} USDC`;
  el.title = `Native balance (18 decimals): ${formatUnits(wei, 18)} USDC. Token view (6 decimals): ${formatUnits(units, 6)} USDC`;
}

// A transaction the page is waiting on is remembered per network and account, so a reload (which MetaMask
// mobile does after a confirmation) still shows its result.
const pendingKey = () => `arclab:pending:${net.chainId}:${state.account}`;
const validPending = (p) => /^0x[0-9a-f]{64}$/i.test(p?.hash)
  && ((p.kind === 'deploy' && p.key in starters) || (p.kind === 'submit' && dep.challenges.some((c) => c.id === p.key)));
const pendingList = () => [store.get(pendingKey())].flat().filter(validPending);
const forgetPending = (hash) => store.set(pendingKey(), pendingList().filter((p) => p.hash !== hash));

async function resumePending() {
  for (const p of pendingList()) {
    const out = p.kind === 'deploy' ? $(`[data-deploy-result="${p.key}"]`) : $(`[data-verdict="${p.key}"]`);
    if (!out) { forgetPending(p.hash); continue; }
    out.innerHTML = `Waiting for the transaction sent before the page reloaded: ${txLink(p.hash)}`;
    try {
      const receipt = await pub.waitForTransactionReceipt({ hash: p.hash, timeout: 120_000 });
      if (receipt.status !== 'success') throw new Error('The transaction reverted.');
      if (p.kind === 'deploy') showDeployed(p.key, receipt);
      else showVerdict(p.key, receipt);
    } catch (e) {
      out.innerHTML = `${escape(explain(e))} ${txLink(p.hash)}`;
    }
    forgetPending(p.hash);
  }
}

async function refreshSolved() {
  if (!state.account) return;
  for (const c of dep.challenges) {
    const solved = await pub.readContract({ address: dep.registry, abi: registryAbi, functionName: 'solved', args: [state.account, BigInt(c.id)] });
    if (solved) setStatus(c.id, 'pass', 'Solved');
  }
}

async function refreshInstructor() {
  const panel = $('#instructor');
  panel.hidden = !state.account || state.account.toLowerCase() !== dep.owner.toLowerCase();
  if (panel.hidden) return;
  const [drip, fund] = await Promise.all([
    pub.readContract({ address: dep.registry, abi: registryAbi, functionName: 'dripWei' }),
    pub.getBalance({ address: dep.registry }),
  ]);
  $('#drip-info').textContent = `Each newly enrolled learner receives ${usdc(drip, 2)} USDC for gas. The gas fund holds ${usdc(fund, 4)} USDC, enough for ${drip ? fund / drip : 0n} more learners.`;
}

function render() {
  const connected = Boolean(state.account);
  $('#connect').textContent = connected ? short(state.account) : 'Connect wallet';
  $$('[data-deploy], #sign, form.submit button').forEach((b) => { b.disabled = !connected; });
  if (!connected) $('#balance').hidden = true;
}

function notice(text) { $('#notice').textContent = text; }

function setStatus(id, s, text) {
  const el = $(`[data-status="${id}"]`);
  el.dataset.state = s;
  el.textContent = text;
}

// ---------- actions ----------
async function send(fn, out, pending, resume) {
  out.innerHTML = 'Confirm in your wallet…';
  let hash;
  try {
    await ensureChain();
    hash = await fn();
    if (resume) store.set(pendingKey(), [...pendingList(), { ...resume, hash }]);
    out.innerHTML = `${pending} ${txLink(hash)}`;
    const receipt = await pub.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted.');
    return receipt;
  } catch (e) {
    out.textContent = explain(e);
    return null;
  } finally {
    if (hash && resume) forgetPending(hash);
    refreshBalance();
  }
}

async function deployStarter(key) {
  const starter = starters[key];
  const out = $(`[data-deploy-result="${key}"]`);
  const receipt = await send(
    () => state.wallet.deployContract({ abi: starter.abi, bytecode: starter.bytecode, args: [state.account] }),
    out, 'Deploying…', { kind: 'deploy', key },
  );
  if (receipt) showDeployed(key, receipt);
}

function showDeployed(key, receipt) {
  const out = $(`[data-deploy-result="${key}"]`);
  const address = receipt.contractAddress;
  state.deployed[key] = address;
  out.innerHTML = `Deployed at ${addrLink(address, address)} (${txLink(receipt.transactionHash)}). It is filled in below.`;
  $(`#addr-${key === 'vault' ? 0 : 1}`).value = address;
}

async function sign() {
  const out = $('#sign-result');
  const checker = dep.challenges[1].checker;
  out.textContent = 'Reading your message from the checker…';
  const message = await pub.readContract({ address: checker, abi: pqAbi, functionName: 'message', args: [state.account] });
  out.textContent = 'Creating a key and signing. This takes a few seconds…';
  await new Promise((r) => setTimeout(r, 30)); // let the text paint before the CPU-bound signing
  const t0 = performance.now();
  const { publicKey, secretKey } = slh.keygen(crypto.getRandomValues(new Uint8Array(48)));
  const sig = slh.sign(hexToBytes(message), secretKey);
  const ms = Math.round(performance.now() - t0);
  state.signature = {
    learner: state.account,
    data: encodeAbiParameters([{ type: 'bytes' }, { type: 'bytes' }], [bytesToHex(publicKey), bytesToHex(sig)]),
  };
  out.innerHTML = `Signed in ${(ms / 1000).toFixed(1)} s. The message is ${(message.length - 2) / 2} bytes and names your address; the signature is ${sig.length.toLocaleString()} bytes. It will be sent with your submission.`;
}

async function submit(form) {
  const id = Number(form.dataset.challenge);
  const input = form.elements.address.value.trim();
  const out = $(`[data-verdict="${id}"]`);
  out.dataset.state = '';
  if (!isAddress(input)) { out.textContent = 'Enter a contract address: 0x followed by 40 hex characters.'; return; }
  let data = '0x';
  if (id === 1) {
    if (!state.signature) { out.textContent = 'Sign your message in step 1 first.'; return; }
    data = state.signature.data;
  }
  const receipt = await send(
    () => state.wallet.writeContract({ address: dep.registry, abi: registryAbi, functionName: 'submit', args: [BigInt(id), getAddress(input), data] }),
    out, 'Grading on Arc…', { kind: 'submit', key: id },
  );
  if (receipt) showVerdict(id, receipt);
}

function showVerdict(id, receipt) {
  const out = $(`[data-verdict="${id}"]`);
  const ev = receipt.logs.map(tryDecode).find((e) => e?.eventName === 'Submitted');
  if (!ev) { out.innerHTML = `This ${txLink(receipt.transactionHash)} recorded no grading result.`; return; }
  const [title, body] = VERDICTS[id][ev.args.code] ?? ['Result', `Code ${ev.args.code}`];
  out.dataset.state = ev.args.passed ? 'pass' : 'fail';
  out.innerHTML = `<strong>${title}</strong><p>${escape(body)}</p><p class="small">Recorded on Arc in ${txLink(receipt.transactionHash, 'this transaction')}.</p>`;
  if (ev.args.passed) setStatus(id, 'pass', 'Solved');
  else if ($(`[data-status="${id}"]`).dataset.state !== 'pass') setStatus(id, 'fail', 'Not solved yet');
  loadBoard();
}

async function enrol(form) {
  const out = $('#enrol-result');
  const lines = form.elements.learners.value.split(/[\s,]+/).filter(Boolean);
  const bad = lines.filter((l) => !isAddress(l));
  if (!lines.length || bad.length) { out.textContent = bad.length ? `Not an address: ${bad.join(', ')}` : 'Add at least one address.'; return; }
  const receipt = await send(
    () => state.wallet.writeContract({ address: dep.registry, abi: registryAbi, functionName: 'enrol', args: [lines.map(getAddress)] }),
    out, 'Enrolling…',
  );
  if (!receipt) return;
  const events = receipt.logs.map(tryDecode).filter(Boolean);
  const ok = events.filter((e) => e.eventName === 'Enrolled').length;
  const failed = events.filter((e) => e.eventName === 'DripFailed').map((e) => short(e.args.learner));
  out.innerHTML = `Enrolled ${ok} of ${lines.length}${failed.length ? `; could not send gas to ${failed.join(', ')}` : ''}. Already enrolled addresses are skipped. ${txLink(receipt.transactionHash)}`;
  refreshInstructor();
  loadBoard();
}

async function fund(form) {
  const out = $('#fund-result');
  let value;
  try { value = parseUnits(form.elements['fund-amount'].value.trim(), 18); } catch { out.textContent = 'Enter an amount in USDC, for example 0.5.'; return; }
  const receipt = await send(() => state.wallet.sendTransaction({ to: dep.registry, value }), out, 'Sending…');
  if (receipt) out.innerHTML = `Added ${formatUnits(value, 18)} USDC. ${txLink(receipt.transactionHash)}`;
  refreshInstructor();
}

function tryDecode(log) {
  try { return decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics }); } catch { return null; }
}

// ---------- board ----------
// The public RPC caps eth_getLogs at 10,000 blocks, so the full history comes from the explorer's API in one
// request, merged with the latest 10,000 blocks from the RPC (which the explorer may not have indexed yet).
// If the explorer is unavailable, the whole range is read from the RPC in 10,000-block chunks.
const RPC_SPAN = 10_000n;

async function explorerLogs() {
  const seen = new Set();
  const logs = [];
  for (let page = 1; page <= 50; page++) {
    const url = `${net.explorerUrl}/api?module=logs&action=getLogs&address=${dep.registry}` +
      `&fromBlock=${dep.deployedAtBlock}&toBlock=latest&page=${page}&offset=1000`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`explorer HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== '1') {
      if (/no (records|logs) found/i.test(json.message ?? '')) break;
      throw new Error(`explorer: ${json.message}`);
    }
    let added = 0;
    for (const l of json.result) {
      const key = `${l.transactionHash}:${BigInt(l.logIndex)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      added++;
      logs.push({ topics: l.topics.filter(Boolean), data: l.data, blockNumber: BigInt(l.blockNumber), key });
    }
    if (json.result.length < 1000 || !added) break;
  }
  return logs;
}

async function rpcLogs(fromBlock, latest) {
  const logs = [];
  for (let from = fromBlock; from <= latest; from += RPC_SPAN) {
    const to = from + RPC_SPAN - 1n < latest ? from + RPC_SPAN - 1n : latest;
    for (const l of await pub.getLogs({ address: dep.registry, fromBlock: from, toBlock: to })) {
      logs.push({ topics: l.topics, data: l.data, blockNumber: l.blockNumber, key: `${l.transactionHash}:${BigInt(l.logIndex)}` });
    }
  }
  return logs;
}

async function registryLogs() {
  const latest = await pub.getBlockNumber();
  const start = BigInt(dep.deployedAtBlock);
  const recentFrom = latest - RPC_SPAN + 1n > start ? latest - RPC_SPAN + 1n : start;
  let older;
  try {
    older = await explorerLogs();
  } catch {
    older = recentFrom > start ? await rpcLogs(start, recentFrom - 1n) : [];
  }
  const merged = new Map(older.map((l) => [l.key, l]));
  for (const l of await rpcLogs(recentFrom, latest)) merged.set(l.key, l);
  return [...merged.values()].sort((a, b) => (a.blockNumber < b.blockNumber ? -1 : a.blockNumber > b.blockNumber ? 1 : 0));
}

// Each submission refreshes the board; a slow earlier refresh must not overwrite a newer one.
let boardRequest = 0;

async function loadBoard() {
  const body = $('#board');
  const request = ++boardRequest;
  try {
    const logs = await registryLogs();
    if (request !== boardRequest) return;
    const rows = new Map();
    const row = (a) => rows.get(a) ?? rows.set(a, { enrolled: false, solved: [false, false], tries: [0, 0], last: 0n }).get(a);
    for (const log of logs) {
      const ev = tryDecode(log);
      if (!ev) continue;
      const r = row(ev.args.learner);
      r.last = log.blockNumber;
      if (ev.eventName === 'Enrolled') r.enrolled = true;
      if (ev.eventName === 'Submitted') {
        r.tries[Number(ev.args.id)]++;
        if (ev.args.passed) r.solved[Number(ev.args.id)] = true;
      }
    }
    const sorted = [...rows.entries()].sort((a, b) => Number(b[1].last - a[1].last));
    const builderCount = sorted.filter(([a]) => builder[a.toLowerCase()]).length;
    $('#board-note').textContent = `Every enrolment and submission recorded by the registry on ${net.name}, newest first. ${builderCount ? `Rows marked as builder wallets are the project's own test wallets, not learners.` : ''}`;
    if (!sorted.length) { body.innerHTML = '<tr><td colspan="4">No submissions yet. Be the first: deploy a starter above and submit it.</td></tr>'; return; }
    const cell = (r, i) => r.solved[i] ? '<td class="pass">Solved</td>' : r.tries[i] ? '<td class="fail">Not yet</td>' : '<td>—</td>';
    body.innerHTML = sorted.map(([a, r]) => `<tr>
      <td>${addrLink(a)}${builder[a.toLowerCase()] ? `<span class="tag">${builder[a.toLowerCase()]}</span>` : r.enrolled ? '<span class="tag">enrolled</span>' : ''}</td>
      ${cell(r, 0)}${cell(r, 1)}<td>${r.tries[0] + r.tries[1]}</td></tr>`).join('');
  } catch (e) {
    if (request !== boardRequest) return;
    body.innerHTML = `<tr><td colspan="4">Could not read results from ${escape(net.name)}: ${escape(explain(e))}</td></tr>`;
  }
}

// ---------- bytes ----------
function hexToBytes(hex) {
  const out = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  return out;
}
function bytesToHex(bytes) {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

// ---------- start ----------
$('#network').textContent = net.name;
if (netName === 'testnet') notice('This is the Arc Testnet rehearsal. Gas is paid in test USDC from faucet.circle.com, or ask the instructor to enrol you.');
$('#contracts').innerHTML = `Contracts on ${escape(net.name)}: registry ${addrLink(dep.registry)}, ${dep.challenges.map((c) => `${escape(c.name)} checker ${addrLink(c.checker)}`).join(', ')}. ${netName === 'mainnet'
  ? `Source verified on <a href="https://repo.sourcify.dev/${net.chainId}/${dep.registry}" target="_blank" rel="noopener">Sourcify</a>.`
  : 'Source verified on the explorer.'}`;
for (const key of Object.keys(starters)) $(`[data-source="${key}"]`).textContent = starters[key].source;

$('#connect').addEventListener('click', () => connect().catch((e) => notice(explain(e))));
$$('[data-deploy]').forEach((b) => b.addEventListener('click', () => deployStarter(b.dataset.deploy)));
$('#sign').addEventListener('click', () => sign().catch((e) => { $('#sign-result').textContent = explain(e); }));
$$('form.submit').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); submit(f); }));
$('#enrol').addEventListener('submit', (e) => { e.preventDefault(); enrol(e.target); });
$('#fund').addEventListener('submit', (e) => { e.preventDefault(); fund(e.target); });
$$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
  await navigator.clipboard.writeText(starters[b.dataset.copy].source);
  b.textContent = 'Copied';
}));

// Reconnect without a prompt when the wallet already allows this site. After a reload that followed a
// connection, keep asking for a few seconds; a fresh visitor gets one quiet check.
waitForProvider(3000).then(async (provider) => {
  if (!provider) return;
  provider.on?.('accountsChanged', async ([a]) => {
    const account = a ?? (await currentAccount(2)); // MetaMask mobile can report [] in passing
    if (!account) store.set(CONNECTED, null);
    useAccount(account);
  });
  const account = await currentAccount(store.get(CONNECTED) ? 6 : 1);
  if (account && !state.account) useAccount(account);
}).catch(() => {});
render();
loadBoard();
