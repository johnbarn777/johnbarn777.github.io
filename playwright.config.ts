import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'iPhone SE', use: { ...devices['iPhone SE'] } },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
    { name: 'iPad Air', use: { ...devices['iPad Air'] } },
    { name: 'Desktop 1440p', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'bash -c "npm run build && npm run preview"',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
});

