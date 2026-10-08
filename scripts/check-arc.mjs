import { readFile } from 'node:fs/promises';

try {
  const config = JSON.parse(await readFile(new URL('../config/arc-networks.json', import.meta.url), 'utf8'));
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !/^--network=(testnet|mainnet)$/.test(args[0]))) {
    throw new Error('Usage: npm run check:arc -- --network=testnet|mainnet');
  }
  const networkName = args[0]?.split('=')[1] ?? process.env.ARC_NETWORK ?? config.defaultNetwork;
  if (!Object.hasOwn(config.networks, networkName)) throw new Error('Select testnet or mainnet.');
  const network = config.networks[networkName];
  const rpcUrl = new URL(process.env.ARC_RPC_URL || network.rpcUrl);
  if (rpcUrl.protocol !== 'https:' || rpcUrl.username || rpcUrl.password) {
    throw new Error('RPC endpoint must use HTTPS without embedded credentials.');
  }

  async function rpc(method, id) {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params: [] }),
      signal: AbortSignal.timeout(10000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error('RPC returned HTTP ' + response.status + '.');
    const data = await response.json();
    if (data.jsonrpc !== '2.0' || data.id !== id || data.error || !/^0x[0-9a-f]+$/i.test(data.result ?? '')) {
      throw new Error('RPC returned an invalid or unsuccessful ' + method + ' response.');
    }
    return BigInt(data.result);
  }

  const chainId = await rpc('eth_chainId', 1);
  if (chainId !== BigInt(network.chainId)) throw new Error('RPC chain ID does not match selected network.');
  const block = await rpc('eth_blockNumber', 2);
  console.log('Arc ' + networkName + ' RPC verified: chainId=' + chainId + '; block=' + block + '.');
} catch {
  // Keep endpoint URLs, provider responses, and credentials out of diagnostic output.
  console.error('Arc RPC check failed. Check network selection, RPC configuration, and availability.');
  process.exitCode = 1;
}
