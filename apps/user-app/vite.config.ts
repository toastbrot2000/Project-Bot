import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'userApp',
      filename: 'remoteEntry.js',
      exposes: {
        './Main': './src/App.jsx',
      },
      shared: ['react', 'react-dom', 'reactflow'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
