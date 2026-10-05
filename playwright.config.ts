import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * Sunucu `127.0.0.1` üzerinden dinlenir; `localhost` bazı sürümlerde IPv6'ya
 * (::1) çözüldüğü için sunucuya ulaşılamıyor.
 *
 * `reuseExistingServer: false` bilerek: yerelde açık bir preview sunucusu varsa
 * Playwright portu kullanamadığında net biçimde hata verir. Sessizce eski bir
 * derlemeyi test etmekten iyidir.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: process.env['CI'] !== undefined,
  retries: process.env['CI'] !== undefined ? 1 : 0,
  // Tüm testler tek bir preview sunucusuna (port 4173) gidiyor ve her biri
  // JSHint'in ~1.3 MB'ını indiriyor. Çok paralel koşumda Firefox zaman aşımına
  // takılıyordu; 3 worker yükü makul tutuyor.
  workers: process.env['CI'] !== undefined ? 1 : 3,
  reporter:
    process.env['CI'] === undefined ? [['list']] : [['github'], ['html', { open: 'never' }]],
  // Linterlar (JSHint ~1.3 MB) ilk boşta indirildiği için açılış yavaş olabiliyor;
  // özellikle üç tarayıcı paralel koşarken Firefox zaman aşımına takılıyordu.
  timeout: 90_000,
  expect: { timeout: 20_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: 'ignore',
  },
});
