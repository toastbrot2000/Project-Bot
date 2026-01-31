import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: '../../apps', // Point to apps directory
  testMatch: '**/test/e2e/*.spec.ts', // Match spec files in e2e folder inside apps
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'admin-app',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5002',
      },
      testMatch: 'admin-app/test/e2e/*.spec.ts',
    },
    {
      name: 'user-app',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5001',
      },
      testMatch: 'user-app/test/e2e/*.spec.ts',
    },
    {
      name: 'website-host',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5003',
      },
      testMatch: 'website-host/test/e2e/*.spec.ts',
    },
    {
      name: 'backend',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:1337',
      },
      testMatch: 'backend/test/e2e/*.spec.ts',
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter admin-app dev',
      url: 'http://localhost:5002',
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
    {
      command: 'pnpm --filter user-app dev',
      url: 'http://localhost:5001',
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
    {
      command: 'pnpm --filter website-host dev',
      url: 'http://localhost:5003',
      reuseExistingServer: !process.env.CI,
      cwd: '../../',
    },
    {
      command: 'pnpm --filter backend develop',
      url: 'http://localhost:1337',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      cwd: '../../',
    }
  ],
});
