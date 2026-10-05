import { describe, expect, it } from 'vitest';

import { getDefaultCode } from '../src/app/defaultCode';
import { SUPPORTED_LANGS } from '../src/app/i18n';
import { parseFullCode } from '../src/core/document';

describe('getDefaultCode', () => {
  it('her dil için ayrıştırılabilir bir tam belge döner', () => {
    for (const lang of SUPPORTED_LANGS) {
      const code = getDefaultCode(lang);
      const { htmlCode, cssCode, jsCode } = parseFullCode(code);

      expect(htmlCode).toMatch(/^<!DOCTYPE html>/u);
      expect(htmlCode).toContain('<body>');
      expect(cssCode.length).toBeGreaterThan(0);
      expect(jsCode).toContain('function');
    }
  });

  it('dile göre yerelleştirilmiş içerik üretir', () => {
    expect(getDefaultCode('tr')).toContain('Merhaba Dünya!');
    expect(getDefaultCode('tr')).toContain('Bana Tıkla');
    expect(getDefaultCode('en')).toContain('Hello World!');
    expect(getDefaultCode('en')).toContain('Click Me');
  });

  it('script kaçış hacki içermez', () => {
    for (const lang of SUPPORTED_LANGS) {
      expect(getDefaultCode(lang)).not.toContain('<\\/script>');
    }
  });

  it('ayrıştırma sonrası ayrık görünüme doğru dağıtılır', () => {
    const { htmlCode, cssCode, jsCode } = parseFullCode(getDefaultCode('tr'));

    expect(htmlCode).toContain('<h1>Merhaba Dünya!</h1>');
    expect(htmlCode).not.toContain('<style>');
    expect(cssCode).toContain('font-family');
    expect(jsCode).toContain('myFunction');
  });
});
