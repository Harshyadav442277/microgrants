import { readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = [
  'README.md', 'RULES.md', 'PRD.md', 'ARCHITECTURE.md', 'PHASES.md', 'GAPS.md', 'DEMO.md',
  'docs/ARC_SETUP.md', 'docs/SUBMISSION.md', 'docs/STATUS.md', 'docs/EVIDENCE.md',
  'config/arc-networks.json', '.env.example', '.gitignore', '.github/workflows/check.yml',
];
const errors = [];
const fail = (message) => errors.push(message);

for (const file of required) {
  try { await access(path.join(root, file)); }
  catch { fail('Missing required file: ' + file); }
}

const listing = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  cwd: root, encoding: 'utf8',
});
if (listing.status !== 0) fail('Could not list repository files with Git.');
const files = [...new Set((listing.stdout ?? '').split('\0').filter(Boolean))];
for (const file of files) {
  const basename = path.posix.basename(file);
  if ((basename.startsWith('.env') && basename !== '.env.example') ||
      /\.(?:pem|key|p12|pfx)$/i.test(file) ||
      /(?:^|\/)(?:node_modules|secrets|wallets|keystore|\.local|\.codex|\.claude)(?:\/|$)/.test(file) ||
      /^(?:CLAUDE|AGENTS|MEMORY)\.md$/.test(file)) {
    fail('Local or sensitive file included in repository: ' + file);
    continue;
  }
  if (!/\.(?:md|mjs|json|yml|yaml)$/.test(file) && basename !== '.env.example') continue;
  const content = await readFile(path.join(root, file), 'utf8');
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content) ||
      /\bgh[pousr]_[A-Za-z0-9]{30,}\b/.test(content) ||
      /\bgithub_pat_[A-Za-z0-9_]{40,}\b/.test(content)) {
    fail('Possible credential found in ' + file + '; inspect locally.');
  }
  if (!file.endsWith('.md')) continue;
  if (!/^#\s+\S/m.test(content)) fail('Missing document title: ' + file);
  for (const match of content.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const relativeTarget = decodeURIComponent(target.split('#')[0]);
    const resolved = path.resolve(path.dirname(path.join(root, file)), relativeTarget);
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
      fail('Link leaves repository in ' + file);
      continue;
    }
    try { await access(resolved); }
    catch { fail('Broken local link in ' + file + ': ' + target); }
  }
}

try {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (pkg.private !== true) fail('Scaffold package must remain private.');
  const config = JSON.parse(await readFile(path.join(root, 'config/arc-networks.json'), 'utf8'));
  if (config.defaultNetwork !== 'testnet') fail('Default network must be testnet.');
  for (const [name, expectedId] of [['testnet', 5042002], ['mainnet', 5042]]) {
    const network = config.networks[name];
    if (network.chainId !== expectedId || network.nativeCurrency.decimals !== 18 || network.nativeCurrency.symbol !== 'USDC') {
      fail('Unexpected public network configuration: ' + name);
    }
    for (const endpoint of [network.rpcUrl, network.explorerUrl]) {
      const url = new URL(endpoint);
      if (url.protocol !== 'https:' || url.username || url.password || url.search) {
        fail('Network configuration must use public HTTPS endpoints.');
      }
    }
  }
} catch { fail('Invalid package or network configuration.'); }

for (const script of ['scripts/check-repo.mjs', 'scripts/check-arc.mjs', 'scripts/simulate-mainnet.mjs', 'scripts/make-pq-fixture.mjs', 'scripts/run-journey.mjs', 'scripts/build-web.mjs', 'scripts/serve.mjs']) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, script)], { encoding: 'utf8' });
  if (result.status !== 0) fail('JavaScript syntax check failed: ' + script);
}

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Repository checks passed.');
}
