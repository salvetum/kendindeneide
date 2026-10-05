import { describe, expect, it, vi } from 'vitest';

import { SUPPORTED_LANGS, hasKey, isHtmlKey, isLang, keysOf, t } from '../src/app/i18n';

describe('i18n', () => {
  it('TR ve EN sözlükleri aynı anahtarları içerir', () => {
    const [tr, en] = SUPPORTED_LANGS.map(keysOf);

    expect(tr).not.toBeUndefined();
    expect(en).not.toBeUndefined();
    expect(new Set(tr)).toEqual(new Set(en));
  });

  it('hiçbir çeviri boş değil', () => {
    for (const lang of SUPPORTED_LANGS) {
      for (const key of keysOf(lang)) {
        // Template anahtarları argüman bekler; boş dize üretmemeleri yeterli.
        const value = t(lang, key, 'x', 'x', 'x');
        expect(value.length, `${lang}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it('template anahtarlarını argümanla doldurur', () => {
    expect(t('tr', 'toastFormatError', 'css')).toContain('CSS');
    expect(t('en', 'toastFormatError', 'css')).toContain('CSS');

    expect(t('tr', 'toastSettingToggle', 'Kodu Sakla', 'true')).toContain('açıldı');
    expect(t('tr', 'toastSettingToggle', 'Kodu Sakla', 'false')).toContain('kapatıldı');
    expect(t('en', 'toastSettingToggle', 'Save Code', 'true')).toContain('enabled');
    expect(t('en', 'toastSettingToggle', 'Save Code', 'false')).toContain('disabled');
  });

  it('HTML gerektiren anahtarları işaretleme içerir', () => {
    for (const key of ['loadErrorMsg', 'infoModalP2', 'infoModalP3']) {
      expect(isHtmlKey(key)).toBe(true);
      expect(t('tr', key)).toContain('<');
    }

    expect(isHtmlKey('title')).toBe(false);
    expect(isHtmlKey('toastRun')).toBe(false);
  });

  it('eksik anahtarda uyarır ve anahtarı döner', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(t('tr', 'yokBoyleBirAnahtar')).toBe('yokBoyleBirAnahtar');
    expect(warn).toHaveBeenCalledWith('Eksik çeviri: tr.yokBoyleBirAnahtar');
  });

  it('isLang ve hasKey yardımcıları', () => {
    expect(isLang('tr')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('de')).toBe(false);

    expect(hasKey('tr', 'title')).toBe(true);
    expect(hasKey('tr', 'toString')).toBe(false);
  });

  it('iki dil arasında başlık ve buton metinleri farklıdır', () => {
    expect(t('tr', 'title')).not.toBe(t('en', 'title'));
    expect(t('tr', 'run')).not.toBe(t('en', 'run'));
  });
});
