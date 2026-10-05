import { expect, test } from '@playwright/test';
import { getEditorValue, openApp, openSeparatedTab, preview, setEditorValue } from './helpers';

test.describe(' açılış', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('ölümcül hata ekranı görünmüyor, editörler hazır', async ({ page }) => {
    await expect(page.locator('#error-overlay')).toBeHidden();
    await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
    await expect(page.locator('#code-editor')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Çalıştır' })).toBeVisible();
  });

  test('preview varsayılan kodu çalıştırıyor', async ({ page }) => {
    await expect(preview(page).locator('h1')).toHaveText('Merhaba Dünya!');
    await expect(preview(page).locator('#demo')).toHaveText('JavaScript sonucu burada görünecek.');
  });

  test('preview içindeki JavaScript çalışıyor', async ({ page }) => {
    const frame = preview(page);
    await frame.getByRole('button', { name: 'Bana Tıkla' }).click();
    await expect(frame.locator('#demo')).toHaveText('Harika, JavaScript çalıştı!');
  });

  test('preview bir Blob URL üzerinden besleniyor', async ({ page }) => {
    await expect(page.locator('#result-frame')).toHaveAttribute('src', /^blob:/);
    await expect(page.locator('#result-frame')).toHaveAttribute('sandbox', /allow-scripts/);
  });
});

test.describe(' </script> kaçışı', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  /**
   * `escapeScriptText` ayrık görünümü korur: JS orada doğrudan editörden
   * okunur, HTML ayrıştırıcısı devreye girmez, dolayısıyla `</script>` kaçırılmalı.
   *
   * Birleşik görünümde ise kullanıcının `</script>` yazması HTML'in kendi
   * kuralı: tarayıcı da ilk `</script>`'te script'i kapatır. Kullanıcı
   * `<\/script>` yazarak kaçabilir; ikinci test bunu doğrular.
   */
  test('ayrık görünümde JS içindeki </script> preview i bozmuyor', async ({ page }) => {
    await openSeparatedTab(page, 'html');

    await setEditorValue(page, 'html', '<p id="out">yok</p>');
    await openSeparatedTab(page, 'js');
    await setEditorValue(
      page,
      'js',
      [
        'document.getElementById("out").textContent = "ok";',
        'document.title = "A</script>B";',
      ].join('\n'),
    );

    await page.getByRole('button', { name: 'Çalıştır' }).click();

    const frame = preview(page);
    await expect(frame.locator('#out')).toHaveText('ok');
    await expect
      .poll(async () => frame.locator('body').evaluate(() => document.title))
      .toBe('A</script>B');
  });

  test('birleşik görünümde kullanıcının kendi kaçışı (\\/<\\/script>) çalışıyor', async ({
    page,
  }) => {
    await setEditorValue(
      page,
      'code',
      [
        '<!DOCTYPE html>',
        '<html><body>',
        '<p id="out">yok</p>',
        '<script>',
        'document.getElementById("out").textContent = "ok";',
        'document.title = "A<\\/script>B";',
        '</' + 'script>',
        '</body></html>',
      ].join('\n'),
    );
    await page.getByRole('button', { name: 'Çalıştır' }).click();

    const frame = preview(page);
    await expect(frame.locator('#out')).toHaveText('ok');
    await expect
      .poll(async () => frame.locator('body').evaluate(() => document.title))
      .toBe('A</script>B');
  });
});

test.describe(' ayrık görünüm', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('ayır → düzenle → birleştir düzenlemeleri koruyor', async ({ page }) => {
    await openSeparatedTab(page, 'html');

    await setEditorValue(page, 'html', '<h1>Ayrik Baslik</h1>');
    await setEditorValue(page, 'css', 'h1 { color: rgb(0, 128, 0); }');
    await setEditorValue(page, 'js', 'document.title = "JS Calisti";');

    await page.getByRole('button', { name: 'Birleştir' }).click();
    await expect(page.locator('#combined-view')).toBeVisible();

    const merged = await getEditorValue(page, 'code');
    expect(merged).toContain('Ayrik Baslik');
    expect(merged).toContain('rgb(0, 128, 0)');
    expect(merged).toContain('JS Calisti');

    await page.getByRole('button', { name: 'Çalıştır' }).click();
    const frame = preview(page);
    await expect(frame.locator('h1')).toHaveText('Ayrik Baslik');
    await expect(frame.locator('h1')).toHaveCSS('color', 'rgb(0, 128, 0)');
    await expect
      .poll(async () => frame.locator('body').evaluate(() => document.title))
      .toBe('JS Calisti');
  });

  test('her sekme kendi editörünü gösteriyor', async ({ page }) => {
    await openSeparatedTab(page, 'html');
    await expect(page.locator('#html-pane .CodeMirror')).toBeVisible();

    await openSeparatedTab(page, 'css');
    await expect(page.locator('#css-tab')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#html-tab')).toHaveAttribute('aria-selected', 'false');

    await openSeparatedTab(page, 'js');
    await expect(page.locator('#js-tab')).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe(' tema ve modaller', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('tema düğmesi açık ve koyu arasında geçiş yapıyor', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.locator('#theme-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.locator('#theme-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('Escape ile modal kapanıyor', async ({ page }) => {
    await page.locator('#settings-btn').click();
    await expect(page.locator('#settings-modal')).toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#settings-modal')).not.toHaveClass(/show/);
  });
});
