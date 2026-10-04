import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  testIgnore: process.env.SCREENS_DIR ? [] : ['**/screens.spec.ts'],
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/bit-design-system/`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Library first (the gallery imports its built dist), then the gallery build, then preview.
    command: 'pnpm --dir ../.. build && pnpm build && pnpm preview',
    url: `http://localhost:${PORT}/bit-design-system/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
