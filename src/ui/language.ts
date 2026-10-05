import { dom } from '../app/dom';
import { isHtmlKey, t } from '../app/i18n';
import { state } from '../app/state';
import type { Lang } from '../app/types';

/** Tüm [data-lang-key] / [data-lang-title] / [data-lang-aria] alanlarını günceller. */
export function applyLanguage(lang: Lang): void {
  state.lang = lang;
  document.documentElement.lang = lang;
  document.title = t(lang, 'title');

  for (const element of document.querySelectorAll<HTMLElement>('[data-lang-key]')) {
    const key = element.dataset.langKey;
    if (!key) continue;
    const value = t(lang, key);
    // Yalnızca bilerek işaretleme içeren anahtarlar HTML olarak basılır.
    if (isHtmlKey(key)) element.innerHTML = value;
    else element.textContent = value;
  }

  for (const element of document.querySelectorAll<HTMLElement>('[data-lang-title]')) {
    const key = element.dataset.langTitle;
    if (key) element.title = t(lang, key);
  }

  for (const element of document.querySelectorAll<HTMLElement>('[data-lang-aria]')) {
    const key = element.dataset.langAria;
    if (key) element.setAttribute('aria-label', t(lang, key));
  }

  dom.separateBtnText.textContent = t(lang, state.separated ? 'combine' : 'separate');
}
