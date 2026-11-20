import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // Every test takes well under a second on its own. These limits exist for a busy computer,
    // where a whole run can slow down ten times over: a test that is only slow must not fail.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Half the processors, so the run leaves room for the editor and the browser.
    maxWorkers: '50%',
  },
});
