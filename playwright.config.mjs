import { defineConfig } from '@playwright/test';

// The page is built to WEB_OUT (default dist/) and served locally; the journey runs against Arc testnet.
const out = process.env.WEB_OUT ?? 'dist';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 300_000,
  expect: { timeout: 60_000 },
  workers: 1,
  reporter: 'list',
  outputDir: process.env.PW_OUT ?? 'test-results',
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure' },
  webServer: {
    command: `node scripts/build-web.mjs --outdir="${out}" && node scripts/serve.mjs "${out}" 4174`,
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
