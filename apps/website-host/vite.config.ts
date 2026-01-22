import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'website_host',
      remotes: {
        userApp: {
          type: 'module',
          name: 'userApp',
          entry: 'http://localhost:5001/remoteEntry.js',
        },
        adminApp: {
          type: 'module',
          name: 'adminApp',
          entry: 'http://localhost:5002/remoteEntry.js',
        },
      },
      shared: ['react', 'react-dom', 'reactflow'],
      dts: false,
    }),
  ],
  build: {
    target: 'esnext',
  },
});
