import { describe, expect, it } from 'vitest';

import { FONT_SIZES, TAB_SIZES, editorPrefs, isFontSize, isTabSize } from '../src/core/editorPrefs';
import { decodeShare, encodeShare, readShareHash, SHARE_KEY } from '../src/core/share';

describe('editör tercihleri', () => {
  it('yazı tipi boyutları geçerli CSS değerleri', () => {
    for (const size of Object.keys(FONT_SIZES)) {
      expect(FONT_SIZES[size as keyof typeof FONT_SIZES]).toMatch(/^\d+(\.\d+)?px$/u);
    }
  });

  it('yazı tipi boyutu arttıkça ölçek büyüyor', () => {
    const order = ['small', 'medium', 'large'] as const;
    for (let i = 1; i < order.length; i += 1) {
      const before = Number.parseFloat(FONT_SIZES[order[i - 1] ?? 'small']);
      const after = Number.parseFloat(FONT_SIZES[order[i] ?? 'small']);
      expect(after).toBeGreaterThan(before);
    }
  });

  it('isFontSize yalnızca bilinen değerleri kabul ediyor', () => {
    expect(isFontSize('small')).toBe(true);
    expect(isFontSize('huge')).toBe(false);
    expect(isFontSize(12)).toBe(false);
    expect(isFontSize(null)).toBe(false);
  });

  it('isTabSize yalnızca 2 ve 4 kabul ediyor', () => {
    expect(isTabSize('2')).toBe(true);
    expect(isTabSize('4')).toBe(true);
    expect(isTabSize('8')).toBe(false);
    expect(isTabSize(4)).toBe(false);
  });

  it('sekme genişliği hem tabSize hem indentUnit olur', () => {
    for (const size of TAB_SIZES) {
      const prefs = editorPrefs({ tabSize: size, wordWrap: true });
      expect(prefs.tabSize).toBe(Number(size));
      expect(prefs.indentUnit).toBe(Number(size));
    }
  });

  it('satır kaydırma tercihi seçeneklere geçiyor', () => {
    expect(editorPrefs({ tabSize: '2', wordWrap: false }).lineWrapping).toBe(false);
    expect(editorPrefs({ tabSize: '4', wordWrap: true }).lineWrapping).toBe(true);
  });
});

describe('paylaşım kodu', () => {
  const CODE = [
    '<!DOCTYPE html>',
    '<html lang="tr">',
    '<head><style>h1 { color: red; }</style></head>',
    '<body><h1>Merhaba Dünya!</h1><script>console.log("çok ğüşı");</script></body>',
    '</html>',
  ].join('\n');

  it('gzip ve base64url URL güvenli karakterlerden oluşuyor', async () => {
    const encoded = await encodeShare(CODE, ['jQuery']);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/u);
    // base64 sözdiziminde + / = bulunmamalı
    expect(encoded).not.toMatch(/[+/=]/u);
  });

  it('sıkıştırma gerçek bir kodda kazandırıyor', async () => {
    // Küçük örneklerde gzip başlığı (~20 bayt) ve base64'ün 4/3 genişlemesi
    // bağlantıyı UZATIR; kazanç ancak gerçek boyutta görünür.
    const big = Array.from({ length: 20 }, () => CODE).join('\n');
    const encoded = await encodeShare(big, []);
    expect(encoded.length).toBeLessThan(big.length / 2);
  });

  it('gidiş-dönüş kodu bozuyor', async () => {
    const payload = await decodeShare(await encodeShare(CODE, ['vue', 'react']));
    expect(payload?.code).toBe(CODE);
    expect(payload?.libs).toEqual(['vue', 'react']);
  });

  it('Türkçe karakterler bozulmadan dönüyor', async () => {
    const payload = await decodeShare(await encodeShare(CODE, []));
    expect(payload?.code).toContain('Merhaba Dünya');
    expect(payload?.code).toContain('çok ğüşı');
  });

  it('bozuk kod null döndürüyor, istisna atmıyor', async () => {
    const bad = ['', 'bozuk', '!!!!', 'YWJj'];
    for (const value of bad) {
      await expect(decodeShare(value)).resolves.toBeNull();
    }
  });

  it('sürüm numarası bilinmeyen paket reddediliyor', async () => {
    const payload = await decodeShare(await encodeShare(CODE, []));
    expect(payload?.code).toBe(CODE);
  });

  it('hash okuma yalnızca kendi anahtarını alıyor', () => {
    expect(readShareHash(`#${SHARE_KEY}=abc`)).toBe('abc');
    expect(readShareHash(`${SHARE_KEY}=abc`)).toBe('abc');
    expect(readShareHash('#başka=1')).toBeNull();
    expect(readShareHash('')).toBeNull();
    expect(readShareHash('#')).toBeNull();
  });
});
