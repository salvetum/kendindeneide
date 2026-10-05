import { describe, expect, it } from 'vitest';

import {
  JSHINT_OPTIONS,
  mapCssLintMessages,
  mapHtmlHintMessages,
  mapJshintErrors,
} from '../src/core/linters';

/**
 * Linter kütüphaneleri global script olarak yüklendiği için bu modülü
 * içe aktarmak `?url` import'larını tetikler ama yalnızca URL üretir;
 * penceredeki global'lara dokunmaz. Testler saf eşleyicileri doğrular.
 */
describe('mapJshintErrors', () => {
  it('null hataları eler', () => {
    expect(mapJshintErrors([null])).toEqual([]);
  });

  it('satır ve sütunu 1 tabanlı bildirimden 0 tabanlı konuma çevirir', () => {
    const [annotation] = mapJshintErrors([
      { line: 3, character: 5, reason: 'Missing semicolon.', code: 'W033' },
    ]);
    expect(annotation?.from).toMatchObject({ line: 2, ch: 4 });
    expect(annotation?.to).toMatchObject({ line: 2, ch: 5 });
    expect(annotation?.message).toBe('Missing semicolon.');
  });

  it('kodu olan hata uyarı, kodu olmayan hata hata sayılır', () => {
    const [warning, error] = mapJshintErrors([
      { line: 1, character: 1, reason: 'uyarı', code: 'W001' },
      { line: 1, character: 1, reason: 'hata', code: null },
    ]);
    expect(warning?.severity).toBe('warning');
    expect(error?.severity).toBe('error');
  });

  it('negatif veya sıfır konumları kelepçeye alır', () => {
    const [annotation] = mapJshintErrors([{ line: 0, character: 0, reason: 'x', code: null }]);
    expect(annotation?.from).toMatchObject({ line: 0, ch: 0 });
  });

  it('JSHINT seçenekleri ES2021 ve kütüphane global degiskenlerini tanir', () => {
    expect(JSHINT_OPTIONS.esversion).toBe(2021);
    expect(JSHINT_OPTIONS.globals.jQuery).toBe(false);
    expect(JSHINT_OPTIONS.globals.document).toBe(true);
  });
});

describe('mapCssLintMessages', () => {
  it('type=error olanları hata, diğerlerini uyarı yapar', () => {
    const [error, warning] = mapCssLintMessages([
      { type: 'error', line: 2, col: 3, message: 'Beklenen }' },
      { type: 'warning', line: 4, col: 1, message: 'Renk önerisi' },
    ]);
    expect(error?.severity).toBe('error');
    expect(warning?.severity).toBe('warning');
    expect(error?.from).toMatchObject({ line: 1, ch: 2 });
  });

  it('sütun 1 ise konumu 0a düşürür', () => {
    const [annotation] = mapCssLintMessages([{ type: 'warning', line: 1, col: 1, message: 'm' }]);
    expect(annotation?.from).toMatchObject({ line: 0, ch: 0 });
    expect(annotation?.to).toMatchObject({ line: 0, ch: 1 });
  });
});

describe('mapHtmlHintMessages', () => {
  it('rule.severity=error ise hata, aksi hâlde uyarı üretir', () => {
    const [error, warning] = mapHtmlHintMessages([
      {
        message: 'Tag adı eşleşmiyor',
        line: 3,
        col: 2,
        rule: { id: 'tagname', severity: 'error' },
      },
      { message: 'nitlık önerisi', line: 1, col: 1 },
    ]);
    expect(error?.severity).toBe('error');
    expect(warning?.severity).toBe('warning');
  });

  it('0 tabanlı konuma çevirir', () => {
    const [annotation] = mapHtmlHintMessages([{ message: 'm', line: 5, col: 7 }]);
    expect(annotation?.from).toMatchObject({ line: 4, ch: 6 });
    expect(annotation?.to).toMatchObject({ line: 4, ch: 7 });
  });
});
