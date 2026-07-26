import { defineConfig } from '@playwright/test'
import { resolve } from 'path'

export default defineConfig({
  testDir: resolve(import.meta.dirname, 'e2e'),
  testMatch: '**/*.spec.mjs',
  outputDir: resolve(import.meta.dirname, '../codex/test-evidence/playwright'),
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', {
      outputFolder: resolve(import.meta.dirname, '../codex/test-evidence/playwright-report'),
      open: 'never'
    }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'edge',
      use: {
        browserName: 'chromium',
        channel: 'msedge',
        viewport: { width: 1440, height: 900 }
      }
    }
  ]
})
