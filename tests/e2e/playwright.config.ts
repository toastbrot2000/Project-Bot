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
        baseURL: 'http://127.0.0.1:1337',
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
      command: 'pnpm --filter @project-bot/backend develop -- --debug',
      url: 'http://127.0.0.1:1337',
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000,
      cwd: '../../',
      env: {
        HOST: '0.0.0.0',
        PORT: '1337',
        APP_KEYS: 'testKey1,testKey2',
        API_TOKEN_SALT: 'testSalt',
        ADMIN_JWT_SECRET: 'testSecret',
        TRANSFER_TOKEN_SALT: 'testSalt2',
        ENCRYPTION_KEY: 'testEncryptionKey',
        JWT_SECRET: 'testJwtSecret',
        DATABASE_CLIENT: 'sqlite',
        DATABASE_FILENAME: '.tmp/data.db',
        STRAPI_LOG_LEVEL: 'debug',
        DEBUG: 'strapi:*',
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    }
  ],
});
