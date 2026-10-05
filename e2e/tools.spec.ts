import { expect, test } from '@playwright/test';
import { getEditorValue, openApp, openSeparatedTab, setEditorValue } from './helpers';

const findbar = '#findbar';
const findInput = '#find-input';
const findCount = '#find-count';
const replaceInput = '#replace-input';

test.describe('arama ve değiştir', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await setEditorValue(
      page,
      'code',
      ['<h1>elma</h1>', '<p>elma ve portakal</p>', '<p>ELMA büyük</p>'].join('\n'),
    );
  });

  test('Ctrl+F çubuğu açıyor, Escape kapatıyor', async ({ page }) => {
    await expect(page.locator(findbar)).toBeHidden();
    await page.keyboard.press('Control+f');
    await expect(page.locator(findbar)).toBeVisible();
    await expect(page.locator(findInput)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.locator(findbar)).toBeHidden();
  });

  test('eşleşme sayısını ve konumunu buluyor', async ({ page }) => {
    await page.keyboard.press('Control+f');
    await page.locator(findInput).fill('elma');
    // Büyük/küçük harf duyarlı: "ELMA" eşleşmez.
    await expect(page.locator(findCount)).toHaveText('1 / 2');
    await expect(page.locator(findCount)).not.toHaveClass(/is-empty/u);

    await page.locator(findInput).fill('portakal');
    await expect(page.locator(findCount)).toHaveText('1 / 1');

    await page.locator(findInput).fill('yokburda');
    await expect(page.locator(findCount)).toHaveText('Sonuç yok');
    await expect(page.locator(findCount)).toHaveClass(/is-empty/u);
  });

  test('sonraki ve önceki eşleşmede geziniyor', async ({ page }) => {
    await page.keyboard.press('Control+f');
    await page.locator(findInput).fill('elma');
    const selection = () =>
      page.evaluate(() => {
        const wrapper = document.getElementById('code-editor')?.nextElementSibling as
          (HTMLElement & { CodeMirror?: { getSelection: () => string } }) | null;
        return wrapper?.CodeMirror?.getSelection() ?? '';
      });

    // Yazarken görünüm zıplamıyor (ilk eşleşme seçilmez); gezinme düğmeleri
    // ilk eşleşmeye taşır, sonrakilerde sırayla ilerler ve sonda başa döner.
    await page.locator('#find-next').click();
    expect(await selection()).toBe('elma');
    await page.locator('#find-next').click();
    expect(await selection()).toBe('elma');
    await page.locator('#find-prev').click();
    expect(await selection()).toBe('elma');
  });

  test('Ctrl+H değiştirme kutusunu odaklıyor', async ({ page }) => {
    await page.keyboard.press('Control+h');
    await expect(page.locator(findbar)).toBeVisible();
    await expect(page.locator(replaceInput)).toBeFocused();
  });

  test('tümünü değiştir kodu güncelliyor', async ({ page }) => {
    await page.keyboard.press('Control+h');
    await page.locator(findInput).fill('elma');
    await page.locator(replaceInput).fill('kiraz');
    await page.locator('#replace-all').click();

    const code = await getEditorValue(page, 'code');
    expect(code).not.toContain('elma');
    expect(code).toContain('kiraz ve portakal');
    // Büyük harfli ELMA korunmalı (eşleşme duyarlı).
    expect(code).toContain('ELMA büyük');
  });

  test('editör seçili metni arama kutusuna alıyor', async ({ page }) => {
    await page.evaluate(() => {
      const wrapper = document.getElementById('code-editor')?.nextElementSibling as
        (HTMLElement & { CodeMirror?: { setSelection: (a: unknown, b: unknown) => void } }) | null;
      wrapper?.CodeMirror?.setSelection({ line: 0, ch: 4 }, { line: 0, ch: 8 });
    });
    await page.keyboard.press('Control+f');
    await expect(page.locator(findInput)).toHaveValue('elma');
  });
});

test.describe('editör ayarları', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await page.locator('#settings-btn').click();
  });

  test('yazı tipi boyutu editörü değiştiriyor', async ({ page }) => {
    const fontSize = () =>
      page.evaluate(() => {
        const el = document.querySelector('#combined-view .CodeMirror');
        return el ? Number.parseFloat(getComputedStyle(el).fontSize) : 0;
      });

    const before = await fontSize();
    await page.locator('.settings-select[data-setting="editorFontSize"]').selectOption('large');
    const large = await fontSize();
    expect(large).toBeGreaterThan(before);

    await page.locator('.settings-select[data-setting="editorFontSize"]').selectOption('small');
    const small = await fontSize();
    expect(small).toBeLessThan(large);
  });

  test('sekme genişliği 4 ve 2 arasında değişiyor', async ({ page }) => {
    const tabSize = () =>
      page.evaluate(() => {
        const wrapper = document.getElementById('code-editor')?.nextElementSibling as
          (HTMLElement & { CodeMirror?: { getOption: (n: string) => unknown } }) | null;
        return Number(wrapper?.CodeMirror?.getOption('tabSize') ?? 0);
      });

    expect(await tabSize()).toBe(4);
    await page.locator('.settings-select[data-setting="editorTabSize"]').selectOption('2');
    expect(await tabSize()).toBe(2);
  });

  test('satır kaydırma açılıp kapanıyor', async ({ page }) => {
    const wrapping = () =>
      page.evaluate(() => {
        const el = document.querySelector('#combined-view .CodeMirror');
        return el ? el.classList.contains('CodeMirror-wrap') : false;
      });

    const toggle = page.locator('.setting-item[data-key="editorWordWrap"]');
    expect(await wrapping()).toBe(true);
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/u);
    expect(await wrapping()).toBe(false);
  });

  test('tercihler sayfa yenilendiğinde korunuyor', async ({ page }) => {
    await page.locator('.settings-select[data-setting="editorFontSize"]').selectOption('large');
    await page.locator('.settings-select[data-setting="editorTabSize"]').selectOption('2');
    await page.locator('.setting-item[data-key="editorWordWrap"]').click();

    await page.reload();
    await page.locator('#settings-btn').click();
    await expect(page.locator('.settings-select[data-setting="editorFontSize"]')).toHaveValue(
      'large',
    );
    await expect(page.locator('.settings-select[data-setting="editorTabSize"]')).toHaveValue('2');
    await expect(page.locator('.setting-item[data-key="editorWordWrap"]')).not.toHaveClass(
      /active/u,
    );
  });
});

test.describe('URL ile paylaşım', () => {
  const CODE = ['<h1>Paylaşılan</h1>', '<p>ğüşi öç</p>'].join('\n');

  test('Paylaş düğmesi bağlantıyı adres çubuğuna yazıyor', async ({ page }) => {
    await openApp(page);
    await setEditorValue(page, 'code', CODE);

    await page.locator('#share-btn').click();
    await expect(page).toHaveURL(/#code=/u);
    const hash = await page.evaluate(() => window.location.hash);
    expect(hash).toMatch(/^#code=[A-Za-z0-9_-]+$/u);
  });

  test('paylaşılan bağlantı kodu baştan yüklüyor', async ({ page }) => {
    await openApp(page);
    await setEditorValue(page, 'code', CODE);
    await page.locator('#share-btn').click();
    await expect(page).toHaveURL(/#code=/u);
    const sharedUrl = page.url();

    // Yeni bir oturum: aynı adres, boş depo.
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.goto(sharedUrl);
    // Yalnızca hash değiştiği için tarayıcı belgeyi yeniden YÜKLEMEZ;
    // açılış kodunun çalışması için reload gerekiyor.
    await page.reload();

    await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
    await expect
      .poll(async () => getEditorValue(page, 'code'), { timeout: 15_000 })
      .toContain('Paylaşılan');
    await expect
      .poll(async () => getEditorValue(page, 'code'), { timeout: 15_000 })
      .toContain('ğüşi öç');
  });

  test('bozuk bağlantı uygulamayı düşürmüyor', async ({ page }) => {
    await openApp(page);
    await page.goto('/#code=bozukveri');
    // Hash değişimi belgeyi yeniden yüklemez; açılış kodunun çalışması için
    // reload gerekiyor.
    await page.reload();
    await expect(page.locator('#error-overlay')).toBeHidden();
    await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
    await expect(page.locator('#toast')).toContainText('okunamadı');
  });

  test('paylaşılan kod konsol köprüsü içermiyor', async ({ page }) => {
    await openApp(page);
    await setEditorValue(page, 'code', CODE);
    await page.locator('#share-btn').click();
    await expect(page).toHaveURL(/#code=/u);

    const sharedUrl = page.url();
    await page.goto(sharedUrl);
    await page.reload();
    await expect
      .poll(async () => getEditorValue(page, 'code'), { timeout: 15_000 })
      .not.toContain('kendindeneide/diagnostics');
  });
});

test.describe('arama ayrık görünümde', () => {
  test('aktif sekmede arama yapıyor', async ({ page }) => {
    await openApp(page);
    await openSeparatedTab(page, 'css');
    await setEditorValue(page, 'css', ['.a { color: red; }', '.b { color: blue; }'].join('\n'));

    await page.keyboard.press('Control+f');
    await page.locator(findInput).fill('color');
    await expect(page.locator(findCount)).toHaveText('1 / 2');

    await page.locator('#find-close').click();
    await expect(page.locator(findbar)).toBeHidden();
  });
});
