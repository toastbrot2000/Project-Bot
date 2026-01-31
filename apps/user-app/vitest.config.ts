import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts'],
    // STRICT INCLUDE
    include: ['test/unit/**/*.{test,spec}.{js,ts,jsx,tsx}', 'test/integration/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@project-bot/shared-flow': path.resolve(__dirname, '../../packages/shared-flow/index.ts'),
      '@project-bot/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@project-bot/ui-theme': path.resolve(__dirname, '../../packages/ui-theme/src/index.ts'),
      '@project-bot/tailwind-config': path.resolve(__dirname, '../../packages/tailwind-config/index.ts'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
  },
});
