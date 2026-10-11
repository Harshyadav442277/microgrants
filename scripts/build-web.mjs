// Builds the Arc Lab page into dist/ (or --outdir=<dir>).
// --starters=<forge out dir> first regenerates src/starters.json from the compiled starter contracts, so the
// bytecode the page deploys always matches the source it shows. The generated file is committed, so a hosted
// build does not need Foundry.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const outdir = path.resolve(root, arg('outdir') ?? 'dist');

const forgeOut = arg('starters');
if (forgeOut) {
  const starters = {};
  for (const [key, name] of [['vault', 'StarterVault'], ['verifier', 'StarterVerifier']]) {
    const artifact = JSON.parse(await readFile(path.join(forgeOut, `${name}.sol`, `${name}.json`), 'utf8'));
    starters[key] = {
      name,
      abi: artifact.abi,
      bytecode: artifact.bytecode.object,
      source: await readFile(path.join(root, 'contracts/src/starters', `${name}.sol`), 'utf8'),
    };
  }
  await writeFile(path.join(root, 'src/starters.json'), JSON.stringify(starters, null, 2) + '\n');
  console.log('src/starters.json regenerated');
}

await mkdir(outdir, { recursive: true });
await build({
  entryPoints: [path.join(root, 'src/app.js')],
  bundle: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  target: 'es2022',
  outfile: path.join(outdir, 'app.js'),
  logLevel: 'warning',
});
for (const file of ['index.html', 'style.css']) await copyFile(path.join(root, 'src', file), path.join(outdir, file));
console.log(`built ${outdir}`);
