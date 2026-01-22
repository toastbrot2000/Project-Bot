import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'adminApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/App.jsx',
      },
      shared: ['react', 'react-dom', 'reactflow'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
