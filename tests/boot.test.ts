import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Editor } from 'codemirror';
import { beforeAll, describe, expect, it } from 'vitest';

/** Editör örneği, DOM kurulduktan sonra dinamik import ile alınır. */
let combinedEditor: Editor;

/**
 * jsdom, CodeMirror'ın ölçüm için kullandığı Range API'sini ve Blob URL'leri
 * tam uygulamaz; bu yüzden gerekli parçalar taklit edilir.
 */
function stubJsdomGaps(): void {
  const rect = { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 } as DOMRect;
  const rectList = Object.assign([], { item: () => null }) as unknown as DOMRectList;

  // jsdom Range'ında bu metotlar hiç tanımlı değil; doğrudan atanmalı.
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => rect,
  });
  Object.defineProperty(Range.prototype, 'getClientRects', {
    configurable: true,
    value: () => rectList,
  });

  let counter = 0;
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: () => `blob:mock/${++counter}`,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: () => undefined,
  });
}

/**
 * Uygulamanın gerçek HTML iskeletiyle ayağa kalkabildiğini doğrular.
 *
 * `src/app/dom.ts` eksik bir element bulduğunda fırlatır; bu test, index.html
 * ile src/ arasındaki isim kaymasını CI'da yakalar.
 */
const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

function bodyMarkup(): string {
  const match = /<body[^>]*>([\s\S]*)<\/body>/u.exec(indexHtml);
  if (!match?.[1]) throw new Error('index.html içinde <body> bulunamadı');
  return match[1];
}

describe('uygulama açılışı', () => {
  beforeAll(async () => {
    stubJsdomGaps();
    document.body.innerHTML = bodyMarkup();
    window.localStorage.clear();
    await import('../src/main');
    const { requireEditor } = await import('../src/core/editors');
    combinedEditor = requireEditor('code');
  });

  it('ölümcül hata ekranını göstermez', () => {
    const overlay = document.getElementById('error-overlay');

    expect(overlay).not.toBeNull();
    expect(overlay?.style.display).not.toBe('flex');
  });

  it('birleşik editörü CodeMirror ile oluşturur', () => {
    const wrapper = document.querySelector('#combined-view .CodeMirror');

    expect(wrapper).not.toBeNull();
    expect(document.getElementById('code-editor')?.style.display).toBe('none');
  });

  it('varsayılan kodu editöre yazar', () => {
    expect(combinedEditor.getValue()).toContain('Merhaba Dünya!');
  });

  it('kaydedilmemiş değişiklik işareti bırakmaz', () => {
    expect(document.documentElement.lang).toBe('tr');
    expect(document.title).toBe('Dene ve Öğren!');
    expect(document.body.classList.contains('dirty')).toBe(false);
    expect(document.getElementById('separate-btn-text')?.textContent).toBe('Dilleri Ayır');
  });

  it('ayarlar panelini uygulama ayarlarıyla doldurur', () => {
    const labels = [...document.querySelectorAll('#settings-grid .setting-item')].map(
      (item) => item.textContent,
    );

    expect(labels).toContain('Kodu Sakla');
    expect(labels).toContain('Oto-Çalıştır');
    expect(labels).toContain('jQuery');
  });

  it('preview çerçevesini Blob URL ile besler', () => {
    const frame = document.getElementById('result-frame') as HTMLIFrameElement;

    expect(frame.src).toMatch(/^blob:/u);
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts');
    expect(frame.getAttribute('sandbox')).toContain('allow-modals');
  });

  it('preview çerçevesinde allow-same-origin açıktır', () => {
    // WebKit yalnızca opaque origin'li belgelerde hata detaylarını maskeliyor
    // ("Script error.", lineno 0). Bu nitelik olmadan konsol paneli Safari'de
    // hiçbir şey göstermez. Bedeli kullanıcının kodu ana pencereye erişebilir.
    const frame = document.getElementById('result-frame') as HTMLIFrameElement;

    expect(frame.getAttribute('sandbox')).toContain('allow-same-origin');
  });

  it('tüm düğme ve sekme referanslarını çözer', () => {
    for (const id of [
      'run-btn',
      'format-btn',
      'separate-btn',
      'save-btn',
      'revert-btn',
      'clear-btn',
      'settings-btn',
      'info-btn',
      'theme-btn',
      'error-refresh-btn',
      'modal-confirm-btn',
      'modal-cancel-btn',
      'settings-close-btn',
      'info-close-btn',
      'resizer',
    ]) {
      expect(document.getElementById(id), id).not.toBeNull();
    }

    expect(document.querySelectorAll('#editor-tabs [data-editor]')).toHaveLength(3);
  });

  it('tema düğmesi koyu/açık arasında geçiş yapar', () => {
    const themeBtn = document.getElementById('theme-btn') as HTMLButtonElement;

    expect(document.documentElement.dataset.theme).toBe('dark');
    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    themeBtn.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ayarlar modalı Escape ile kapanır', () => {
    document.querySelector<HTMLButtonElement>('#settings-btn')?.click();

    const modal = document.getElementById('settings-modal') as HTMLElement;
    expect(modal.classList.contains('show')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(modal.classList.contains('show')).toBe(false);
  });
});
