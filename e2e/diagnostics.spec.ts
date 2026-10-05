import { expect, type Page, test } from '@playwright/test';
import { getEditorValue, openApp, preview, previewHtml, setEditorValue } from './helpers';

/** Birleşik editöre kod yazar ve "Çalıştır"a basar (oto-çalıştırma varsayılan kapalı). */
async function run(page: Page, code: string): Promise<void> {
  await setEditorValue(page, 'code', code);
  await page.locator('#run-btn').click();
}

const panel = '#diagnostics';
const entries = '#diagnostics-list .diagnostics-entry';
const summary = '#diagnostics-summary';

test.describe('Önizleme konsolu', () => {
  test('temiz kodda panel gizli kalır', async ({ page }) => {
    await openApp(page);
    await expect(page.locator(panel)).toBeHidden();
    await expect(page.locator(entries)).toHaveCount(0);
  });

  test('çalışma zamanı hatasını satır bilgisiyle gösterir', async ({ page }) => {
    await openApp(page);
    await run(
      page,
      '<h1 id="baslik">Merhaba</h1>\n<script>document.querySelector("#yok").click();</script>',
    );

    const entry = page.locator(entries).first();
    await expect(entry).toBeVisible();
    await expect(entry).toHaveClass(/error/);
    await expect(entry.locator('.diagnostics-text')).toContainText('null');
    await expect(entry.locator('.diagnostics-at')).toHaveText(/^\d+:\d+$/);
    await expect(page.locator(summary)).toHaveText('1 hata · 0 uyarı');
  });

  test('sözdizimi hatası yakalanır (kullanıcının kodu çalışmasa bile)', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>function () { var = ; }</script>');

    const entry = page.locator(entries).first();
    await expect(entry).toHaveClass(/error/);
    await expect(entry.locator('.diagnostics-text')).toContainText('SyntaxError');
  });

  test('console.error ve console.warn yakalanır', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("kirmizi", 42); console.warn("sari");</script>');

    await expect(page.locator(entries)).toHaveCount(2);
    await expect(page.locator(`${entries}.error .diagnostics-text`)).toHaveText('kirmizi 42');
    await expect(page.locator(`${entries}.warn .diagnostics-text`)).toHaveText('sari');
    await expect(page.locator(summary)).toHaveText('1 hata · 1 uyarı');
  });

  test('işlenmemiş promise reddi yakalanır', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>Promise.reject(new Error("veri yok"));</script>');

    const entry = page.locator(entries).first();
    await expect(entry.locator('.diagnostics-text')).toContainText('İşlenmemiş promise reddi');
    await expect(entry.locator('.diagnostics-text')).toContainText('veri yok');
  });

  test('yüklenemeyen kaynak uyarı olarak listelenir', async ({ page }) => {
    await openApp(page);
    // .invalid TLD'si her zaman çözülemez; ağ erişimi gerektirmez.
    await run(page, '<img src="https://example.invalid/yok.png" alt="">');

    const entry = page.locator(entries).first();
    await expect(entry).toHaveClass(/warn/);
    await expect(entry.locator('.diagnostics-text')).toContainText('img yüklenemedi');
    await expect(entry.locator('.diagnostics-text')).toContainText('example.invalid');
    // Kaynak hatasında satır bilgisi anlamsız.
    await expect(entry.locator('.diagnostics-at')).toHaveCount(0);
  });

  test('çökertme ve genişletme düğmeleri çalışır', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("hata");</script>');

    const toggle = page.locator('#diagnostics-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#diagnostics-list')).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#diagnostics-list')).toBeHidden();

    await toggle.click();
    await expect(page.locator('#diagnostics-list')).toBeVisible();
  });

  test('paneldeki Temizle düğmesi günlüğü boşaltır', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("bir"); console.warn("iki");</script>');
    await expect(page.locator(entries)).toHaveCount(2);

    await page.locator('#diagnostics-clear').click();
    await expect(page.locator(entries)).toHaveCount(0);
    await expect(page.locator(panel)).toBeHidden();
  });

  test('yeniden çalıştırmada eski hatalar düşer', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("eski");</script>');
    await expect(page.locator(entries)).toHaveCount(1);

    await run(page, '<h1>temiz</h1>');
    await expect(page.locator(entries)).toHaveCount(0);
    await expect(page.locator(panel)).toBeHidden();
  });

  test('Sonucu Temizle de konsolu kapatır', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("hata");</script>');
    await expect(page.locator(panel)).toBeVisible();

    await page.locator('#clear-btn').click();
    await expect(page.locator(panel)).toBeHidden();
  });

  test('ayrık görünümde de hata yakalar', async ({ page }) => {
    await openApp(page);
    await setEditorValue(page, 'code', '<h1>Merhaba</h1>');
    await page.locator('#separate-btn').click();
    await expect(page.locator('#separated-view')).toBeVisible();

    await page.locator('#js-tab').click();
    await setEditorValue(page, 'js', 'noSuchFunction();');
    await page.locator('#run-btn').click();

    await expect(page.locator(entries).first()).toContainText('noSuchFunction');
  });

  test('hata durumunda preview yine de görünür kalır', async ({ page }) => {
    await openApp(page);
    await run(page, '<h1 id="baslik">Yazı</h1><script>throw new Error("patladi");</script>');

    await expect(preview(page).locator('#baslik')).toHaveText('Yazı');
    await expect(page.locator(entries).first()).toBeVisible();
  });

  test('köprü kalıcı metne sızmaz', async ({ page }) => {
    await openApp(page);
    await run(page, '<script>console.error("hata");</script>');
    await expect(page.locator(entries)).toHaveCount(1);

    // Köprü yalnızca çalıştırılan önizlemede bulunmalı.
    expect(await previewHtml(page)).toContain('kendindeneide/diagnostics');
    expect(await getEditorValue(page, 'code')).not.toContain('kendindeneide/diagnostics');
  });

  test('dil değişince günlük yeniden basılır', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem('language', 'en');
      } catch {
        /* opaque origin */
      }
    });
    await page.goto('/');
    await expect(page.locator('#error-overlay')).toBeHidden();

    await run(page, '<script>console.error("boom"); Promise.reject(new Error("x"));</script>');
    await expect(page.locator(`${entries}.error`)).toHaveCount(2);
    await expect(page.locator(summary)).toHaveText('2 errors · 0 warnings');
    await expect(
      page.locator('.diagnostics-text', { hasText: 'Unhandled promise rejection' }),
    ).toBeVisible();
  });
});
