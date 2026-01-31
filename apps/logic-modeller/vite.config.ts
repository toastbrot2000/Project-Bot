import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'logicModeller',
      filename: 'remoteEntry.js',
      exposes: {
        './LogicModeller': './src/App.jsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        reactflow: { singleton: true },
      },
      dts: false,
    }),
  ],
  build: {
    target: 'esnext',
  },
  server: {
    port: 5002,
    strictPort: true,
  },
});
