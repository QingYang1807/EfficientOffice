import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8888',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1',
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } }]
})
