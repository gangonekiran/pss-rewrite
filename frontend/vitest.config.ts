import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./setup-file.ts'],
    browser: {
      // CHROME_PATH lets a machine without Playwright's own Chromium use an installed Chrome.
      provider: playwright(
        process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {},
      ),
      enabled: true,
      instances: [{ browser: 'chromium' }],
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
