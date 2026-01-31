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
        logicModeller: {
          type: 'module',
          name: 'logicModeller',
          entry: 'http://localhost:5002/remoteEntry.js',
        },
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
    port: 5173,
    strictPort: true,
  },
});
