import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/test/unit/**', '**/test/integration/**', '**/*.test.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@project-bot/shared-flow': path.resolve(__dirname, './packages/shared-flow/index.ts'),
      '@project-bot/ui': path.resolve(__dirname, './packages/ui/src/index.ts'), // Assuming ui has src/index.ts
      '@project-bot/ui-theme': path.resolve(__dirname, './packages/ui-theme/src/index.ts'),
      '@project-bot/tailwind-config': path.resolve(__dirname, './packages/tailwind-config/index.ts'),
    },
  },
});
