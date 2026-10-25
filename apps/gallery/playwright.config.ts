import { defineConfig, devices } from '@playwright/test';

/** The preview port. E2E_PORT lets parallel runs (other checkouts) use their own; the CLI flag overrides vite's config. */
const PORT = Number(process.env.E2E_PORT ?? 4173);

export default defineConfig({
  testDir: './e2e',
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
    command: `npm run build -w @bit-ds/react && npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}/bit-design-system/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
