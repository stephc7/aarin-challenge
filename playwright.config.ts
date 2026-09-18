import { defineConfig, devices } from '@playwright/test';

// ATENÇÃO: uma execução completa (`npm test`) cria pedidos e contas reais no
// ambiente. Use `npm run test:safe` para rodar sem esse efeito. Ver README,
// seção "Impacto no ambiente compartilhado", para números e justificativa.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://lojaebac.ebaconline.art.br',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
