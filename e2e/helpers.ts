import { expect, type FrameLocator, type Page } from '@playwright/test';

/** Uygulamanın ayağa kalkıp ilk kodun preview'e yansımasını bekler. */
export async function openApp(page: Page): Promise<void> {
  const failures: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });
  page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));

  await page.goto('/');
  await expect(page.locator('#error-overlay')).toBeHidden();
  await expect(page.locator('#combined-view .CodeMirror')).toBeVisible();
  await expect(page.locator('#result-frame')).toHaveAttribute('src', /^blob:/, { timeout: 20_000 });
  await expect
    .poll(() => failures.length, { message: `konsol hataları: ${failures.join(' | ')}` })
    .toBe(0);
}

export function preview(page: Page): FrameLocator {
  return page.frameLocator('#result-frame');
}

/**
 * CodeMirror içeriğini değiştirir.
 *
 * `.CodeMirror` sarmalayıcısı CodeMirror 5 tarafından `wrapper.CodeMirror = cm`
 * ile işaretlenir (`lib/codemirror.js`); bu, tuş tuş yazmaktan hem hızlı hem
 * de otomatik parantez/etiket kapatmanın metni bozmasından güvenli.
 */
export async function setEditorValue(page: Page, slot: string, code: string): Promise<void> {
  await page.evaluate(
    ({ slot: slotId, code: source }) => {
      const textarea = document.getElementById(`${slotId}-editor`);
      const wrapper = textarea?.nextElementSibling as
        (HTMLElement & { CodeMirror?: unknown }) | null;
      const instance = wrapper?.CodeMirror as { setValue(value: string): void } | undefined;
      if (!instance) throw new Error(`CodeMirror bulunamadı: ${slotId}`);
      instance.setValue(source);
    },
    { slot, code },
  );
}

export async function getEditorValue(page: Page, slot: string): Promise<string> {
  return page.evaluate((slotId) => {
    const textarea = document.getElementById(`${slotId}-editor`);
    const wrapper = textarea?.nextElementSibling as (HTMLElement & { CodeMirror?: unknown }) | null;
    const instance = wrapper?.CodeMirror as { getValue(): string } | undefined;
    return instance?.getValue() ?? '';
  }, slot);
}

/** localStorage'a yazılan kod (800 ms debounce sonrası). */
export async function readStoredCode(page: Page): Promise<string | null> {
  return page.evaluate(() => window.localStorage.getItem('liveCodeEditorContent'));
}

/** Ayrık görünüme geçer (gerekirse) ve verilen sekmeyi açar. */
export async function openSeparatedTab(page: Page, slot: 'html' | 'css' | 'js'): Promise<void> {
  const separateButton = page.getByRole('button', { name: 'Dilleri Ayır' });
  if (await separateButton.isVisible()) {
    await separateButton.click();
  }
  await expect(page.locator('#separated-view')).toBeVisible();
  await expect(page.locator('#combined-view')).toBeHidden();

  await page.locator(`#${slot}-tab`).click();
  await expect(page.locator(`#${slot}-tab`)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`#${slot}-pane .CodeMirror`)).toBeVisible();
}
