import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'website_host',
      remotes: {
        userApp: 'userApp@http://localhost:5001/remoteEntry.js',
        adminApp: 'adminApp@http://localhost:5002/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'reactflow'],
    }),
  ],
  build: {
    target: 'esnext',
  },
});
