import { expect, test } from '@playwright/test';
import {
  getEditorValue,
  openApp,
  openSeparatedTab,
  preview,
  readStoredCode,
  setEditorValue,
} from './helpers';

const SAMPLE = ['<!DOCTYPE html>', '<html><body>', '<h1>Kayit Testi</h1>', '</body></html>'].join(
  '\n',
);

test.describe(' kalıcılık', () => {
  test('"Kodu Sakla" açıkken otomatik kayıt yapılıyor ve geri yükleniyor', async ({ page }) => {
    await openApp(page);

    await page.locator('#settings-btn').click();
    await page.locator('.setting-item[data-key="saveCodeEnabled"]').click();
    await expect(page.locator('.setting-item[data-key="saveCodeEnabled"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.press('Escape');

    await setEditorValue(page, 'code', SAMPLE);

    await expect
      .poll(async () => (await readStoredCode(page))?.includes('Kayit Testi') ?? false, {
        timeout: 10_000,
      })
      .toBe(true);

    const stored = await readStoredCode(page);
    expect(stored).not.toContain('<base');

    await page.reload();
    await expect(page.locator('#error-overlay')).toBeHidden();
    await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();

    const restored = await getEditorValue(page, 'code');
    expect(restored).toContain('Kayit Testi');
    expect(restored).not.toContain('<base');
  });

  test('yeniden yükleme kayıtlı metni biriktirmiyor', async ({ page }) => {
    await openApp(page);
    await page.locator('#settings-btn').click();
    await page.locator('.setting-item[data-key="saveCodeEnabled"]').click();
    await page.keyboard.press('Escape');

    for (let round = 0; round < 3; round += 1) {
      await page.reload();
      await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
    }

    const count = ((await readStoredCode(page)) ?? '').split('<base').length - 1;
    expect(count).toBe(0);
  });

  test('"Geri Al" değişikliği hem ekrana hem depoya yazıyor', async ({ page }) => {
    await openApp(page);
    await page.locator('#settings-btn').click();
    await page.locator('.setting-item[data-key="saveCodeEnabled"]').click();
    await page.keyboard.press('Escape');

    await setEditorValue(page, 'code', SAMPLE);
    await expect
      .poll(async () => (await readStoredCode(page))?.includes('Kayit Testi') ?? false)
      .toBe(true);

    await page.getByRole('button', { name: 'Geri Al' }).click();
    await page.getByRole('button', { name: 'Onayla' }).click();

    await expect
      .poll(async () => (await getEditorValue(page, 'code')).includes('Kayit Testi') === false)
      .toBe(true);

    await expect
      .poll(async () => (await readStoredCode(page))?.includes('Kayit Testi') ?? false)
      .toBe(false);

    await page.reload();
    await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
    expect(await getEditorValue(page, 'code')).not.toContain('Kayit Testi');
  });
});

test.describe(' kütüphaneler', () => {
  test('seçilen kütüphane preview içinde gerçekten yükleniyor', async ({ page }) => {
    await openApp(page);

    await page.locator('#settings-btn').click();
    await page.locator('.setting-item[data-key="jQuery"]').click();
    await expect(page.locator('.setting-item[data-key="jQuery"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Çalıştır' }).click();

    const frame = preview(page);
    await expect
      .poll(async () => frame.locator('body').evaluate(() => 'jQuery' in window), {
        timeout: 20_000,
      })
      .toBe(true);
  });
});

test.describe(' dış kaynak bağımlılığı yok', () => {
  test('açılışta hiçbir dış sunucuya istek atılmıyor', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('blob:') || url.startsWith('data:')) return;
      if (url.startsWith('http://127.0.0.1:4173')) return;
      external.push(url);
    });

    await openApp(page);
    await expect(preview(page).locator('h1')).toHaveText('Merhaba Dünya!');

    expect(external, `dış istekler: ${external.join(', ')}`).toHaveLength(0);
  });

  test('JetBrains Mono yerelden yükleniyor ve uygulanıyor', async ({ page }) => {
    const fontRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('.woff2')) fontRequests.push(request.url());
    });

    await openApp(page);

    // Dış stil dosyası olmamalı; Vite'in kendi CSS'i yerel olabilir.
    const externalStyles = await page.evaluate(() =>
      Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((node) => node.getAttribute('href') ?? '')
        .filter((href) => /^https?:/i.test(href)),
    );
    expect(externalStyles, `dış stil dosyası: ${externalStyles.join(', ')}`).toHaveLength(0);

    await expect
      .poll(() => page.evaluate(() => document.fonts.status), { timeout: 15_000 })
      .toBe('loaded');

    const families = await page.evaluate(() =>
      Array.from(document.fonts).map((font) => `${font.family}:${font.weight}:${font.status}`),
    );
    expect(families.some((entry) => entry.startsWith('JetBrains Mono:'))).toBe(true);
    expect(
      fontRequests.every((url) => url.startsWith('http://127.0.0.1:4173')),
      `font istekleri dışarıya gidiyor: ${fontRequests.join(', ')}`,
    ).toBe(true);

    const editorFont = await page
      .locator('#combined-view .CodeMirror-code')
      .evaluate((node) => window.getComputedStyle(node).fontFamily);
    expect(editorFont).toContain('JetBrains Mono');
  });

  test('form kontrolleri gövde fontunu miras alıyor', async ({ page }) => {
    await openApp(page);

    const bodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);

    for (const selector of ['#run-btn', '#format-btn', '#separate-btn', '#save-btn']) {
      const font = await page
        .locator(selector)
        .evaluate((node) => window.getComputedStyle(node).fontFamily);
      expect(font, `${selector} gövde fontunu kullanmıyor`).toBe(bodyFont);
      expect(font).toContain('Segoe UI');
    }
  });
});

test.describe(' biçimlendirme ve lint', () => {
  test('biçimlendir düğmesi kodu düzeltiyor', async ({ page }) => {
    await openApp(page);

    await setEditorValue(
      page,
      'code',
      '<!DOCTYPE html><html><body><div   class="x"  ><p>metin</p></div></body></html>',
    );
    await page.getByRole('button', { name: 'Biçimlendir' }).click();

    await expect.poll(async () => (await getEditorValue(page, 'code')).includes('\n')).toBe(true);
    expect(await getEditorValue(page, 'code')).toContain('class="x"');
  });

  test('ayrık görünümde her sekme kendi linterını çalıştırıyor', async ({ page }) => {
    await openApp(page);
    await openSeparatedTab(page, 'html');

    await setEditorValue(page, 'html', '<div><p>acik etiket');

    await openSeparatedTab(page, 'css');
    // Geçersiz CSS: eksik `}` ve geçersiz renk değeri.
    await setEditorValue(page, 'css', '.a { color: #xyz; ');

    await expect
      .poll(async () => page.locator('#css-pane .CodeMirror-lint-mark').count(), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);

    await openSeparatedTab(page, 'html');
    await expect
      .poll(async () => page.locator('#html-pane .CodeMirror-lint-mark').count(), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
  });

  test('birleşik görünümde HTML lint işareti oluşuyor', async ({ page }) => {
    await openApp(page);

    await setEditorValue(page, 'code', '<div><p>acik etiket</div>');
    await expect
      .poll(async () => page.locator('#combined-view .CodeMirror-lint-mark').count(), {
        timeout: 25_000,
      })
      .toBeGreaterThan(0);
  });
});

test.describe(' temizle', () => {
  test('temizle preview i about:blank yapıyor', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Temizle' }).click();

    await expect(page.locator('#result-frame')).toHaveAttribute('src', 'about:blank');
  });
});
