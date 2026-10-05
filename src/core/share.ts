/**
 * URL ile paylaşım.
 *
 * Kod, adres çubuğunun `hash` bölümüne sıkıştırılarak konur. Harici bir
 * bağımlılık kullanmıyor: tarayıcının kendi `CompressionStream` API'si
 * (gzip) + base64url. Sıkıştırma olmadan base64, kodun yaklaşık yüzde 33
 * büyümesi demek; gzip ile tipik bir HTML/CSS/JS örneğinde bağlantı
 * birkaç yüz bayta düşüyor.
 *
 * Paylaşılan içerik ham kaynaktır: kütüphane betikleri, `<base>` ve
 * konsol köprüsü dahil edilmez (bkz. `serializeForStorage`).
 */

export const SHARE_KEY = 'code';

/** Sürüm numarası: ileride biçim değişirse eski bağlantılar okunabilir kalsın. */
const FORMAT_VERSION = 1;

interface SharePayload {
  readonly v: number;
  readonly code: string;
  readonly libs: readonly string[];
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/gu, '+').replace(/_/gu, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Tek parça bayt akışı. `Blob.stream()` jsdom'da yok, bu yol her yerde çalışır. */
function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array<ArrayBuffer>> {
  const buffer = new Uint8Array(bytes);
  return new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(buffer);
      controller.close();
    },
  });
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const compressed = streamOf(bytes).pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const restored = streamOf(bytes).pipeThrough(new DecompressionStream('gzip'));
  return new Response(restored).text();
}

/** Sıkıştırılmış ve URL'e güvenli hâle getirilmiş kod. */
export async function encodeShare(code: string, libs: readonly string[]): Promise<string> {
  const payload: SharePayload = { v: FORMAT_VERSION, code, libs };
  const json = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(await deflate(json));
}

/** Ters işlem. Biçim tanınmazsa `null` döner (bozuk bağlantı). */
export async function decodeShare(encoded: string): Promise<SharePayload | null> {
  try {
    const json = await inflate(fromBase64Url(encoded));
    const parsed: unknown = JSON.parse(json);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as SharePayload).v !== FORMAT_VERSION ||
      typeof (parsed as SharePayload).code !== 'string'
    ) {
      return null;
    }
    const libs = (parsed as SharePayload).libs;
    return {
      v: FORMAT_VERSION,
      code: (parsed as SharePayload).code,
      libs: Array.isArray(libs)
        ? libs.filter((item): item is string => typeof item === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

/** Adres çubuğundan paylaşılan kodu okur; yoksa `null`. */
export function readShareHash(hash: string): string | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (raw === '') return null;
  const params = new URLSearchParams(raw);
  return params.get(SHARE_KEY);
}

/** Paylaşım bağlantısını üretir. */
export function buildShareUrl(code: string, libs: readonly string[]): Promise<string> {
  return encodeShare(code, libs).then((encoded) => {
    const url = new URL(window.location.href);
    url.hash = `${SHARE_KEY}=${encoded}`;
    return url.toString();
  });
}
