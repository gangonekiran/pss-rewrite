import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  test: {
    setupFiles: ['./setup-file.ts'],

    browser: {
      provider: playwright({
        launchOptions: {
          executablePath:
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        },
      }),

      enabled: true,

      instances: [
        {
          browser: 'chromium',
        },
      ],
    },

    coverage: {
      enabled: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/mocks/*.*'],
    },
  },

  optimizeDeps: {
    include: [
      '@hookform/resolvers/zod',
      '@tanstack/react-query',
      'axios',
      'dayjs',
      'lucide-react',
      'react-dom/client',
      'react-hook-form',
      'react-hot-toast',
      'react-router-dom',
      'react-select',
      'zod',
      'zustand',
    ],
  },
});