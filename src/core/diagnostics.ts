/**
 * Önizlemedeki çalışma zamanı hatalarını ana pencereye taşıyan köprü.
 *
 * Preview iframe'i `sandbox="allow-scripts ..."` ile yükleniyor; `allow-same-origin`
 * olmadığı için iframe ana pencereye doğrudan erişemiyor (ve erişmesi de
 * istenmiyor). Tek geçli kanal `postMessage`. iframe'in kaynağı opaque ("null")
 * olduğundan hedef taraf `"*"` olmak zorunda; güvenlik, ana pencerede kanal
 * adı + `event.source` kontrolüyle sağlanıyor.
 *
 * Köprü metni bir string olarak üretilir ve preview belgesine `<script>` olarak
 * enjekte edilir. Bu dosya saf fonksiyonlar içerir; DOM'a dokunmaz, testi
 * kolaydır.
 */

/** postMessage verisini taşıyan kanal adı. Ana pencere yalnızca bunu kabul eder. */
export const DIAGNOSTIC_CHANNEL = 'kendindeneide/diagnostics';

/**
 * Köprü betiği, kullanıcının `<script>`inin belgede hangi satırdan başladığını
 * bilmez; `buildPreviewDocument` onu hesaplayıp bu jetonu satır sayısıyla
 * değiştirir. Jeton tırnak içinde tutulur: köprü hiçbir zaman
 * değiştirilemezse `Number(...)` NaN döner ve satır yerine boş bırakılır,
 * köprü çalışmaya devam eder.
 */
export const LINE_OFFSET_TOKEN = '__KENDINDENEIDE_LINE_OFFSET__';

/** Kullanıcının betiğini işaretleyen öznitelik (satır kaydırma için). */
export const USER_SCRIPT_MARKER = 'data-kendindeneide-user';

export type DiagnosticKind = 'runtime' | 'console' | 'rejection' | 'resource';
export type DiagnosticLevel = 'error' | 'warn';

export interface DiagnosticReport {
  readonly channel: typeof DIAGNOSTIC_CHANNEL;
  readonly kind: DiagnosticKind;
  readonly level: DiagnosticLevel;
  /** `resource` türünde yüklenemeyen kaynağın adresi, diğerlerinde mesaj metni. */
  readonly text: string;
  /** Yalnızca `resource` türünde anlamlı: `<script>`, `<img>`, ... */
  readonly tag: string | null;
  /** Kullanıcının script'indeki satır (1 tabanlı). Bilinmiyorsa null. */
  readonly line: number | null;
  readonly column: number | null;
}

const KINDS: readonly DiagnosticKind[] = ['runtime', 'console', 'rejection', 'resource'];
const LEVELS: readonly DiagnosticLevel[] = ['error', 'warn'];

/**
 * `postMessage` verisi güvenilmeyen bir girdidir: iframe'ten gelen herhangi bir
 * nesne bu noktaya ulaşabilir. Ayrıştırmadan önce şekil doğrulanır.
 */
export function isDiagnosticReport(value: unknown): value is DiagnosticReport {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<DiagnosticReport>;
  return (
    candidate.channel === DIAGNOSTIC_CHANNEL &&
    typeof candidate.text === 'string' &&
    KINDS.includes(candidate.kind as DiagnosticKind) &&
    LEVELS.includes(candidate.level as DiagnosticLevel)
  );
}

/**
 * Preview belgesine enjekte edilecek köprü betiğinin kaynağı.
 *
 * Notlar:
 * - `console.error`/`console.warn` sarmalanır ama özgün metotlar da çağrılır;
 *   geliştirici konsolunda davranış değişmez.
 * - `error` olayı yalnızca script hatalarını değil, yüklenemeyen kaynakları da
 *   taşır. İkisi `event.target` üzerinden ayrılır.
 * - Hata ayıklama için ayrı bir kaynak yüklemesi gereksinimi yok; betik
 *   `error`, `unhandledrejection` ve `console` üzerinden çalışır.
 */
export function diagnosticsBridgeSource(): string {
  return `(function () {
  var CHANNEL = ${JSON.stringify(DIAGNOSTIC_CHANNEL)};
  var LINE_OFFSET = '${LINE_OFFSET_TOKEN}';
  var MAX_TEXT = 2000;

  function clip(value) {
    var text = String(value);
    return text.length > MAX_TEXT ? text.slice(0, MAX_TEXT) + '\\u2026' : text;
  }

  function describe(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return (value.name || 'Error') + ': ' + value.message;
    if (value === null) return 'null';
    if (typeof value === 'object') {
      if (typeof Node !== 'undefined' && value instanceof Node) {
        var tag = String(value.tagName || '').toLowerCase();
        return '<' + tag + (value.id ? '#' + value.id : '') + '>';
      }
      try {
        var json = JSON.stringify(value);
        return json === undefined ? String(value) : json;
      } catch (error) {
        return Object.prototype.toString.call(value);
      }
    }
    return String(value);
  }

  function report(kind, level, text, tag, line, column) {
    try {
      parent.postMessage(
        {
          channel: CHANNEL,
          kind: kind,
          level: level,
          text: clip(text),
          tag: tag || null,
          line: line || null,
          column: column || null,
        },
        '*',
      );
    } catch (error) {
      // Köprü asla preview'ı bozamalı; parent yoksa veya iletişim kapalıysa
      // sessizce vazgeçilir.
    }
  }

  function join(args) {
    var parts = [];
    for (var i = 0; i < args.length; i += 1) parts.push(describe(args[i]));
    return parts.join(' ');
  }

  // Hata satırı üretilen belgede konumlanır; kullanıcının kodundaki satıra
  // çevirmek için kendi betiğimizin başladığı satırı çıkarırız. Doğru
  // çevrilemiyorsa (ör. betiği head'e taşınmış birleşik kod) satır göstermek
  // yerine boş bırakılır.
  function userLine(lineno) {
    if (!lineno) return null;
    var line = lineno - Number(LINE_OFFSET);
    return line > 0 ? line : null;
  }

  // \`true\` = capture fazında dinle. Kaynak hataları (\`<img>\`, \`<link>\`, \`<script>\`)
  // BUBBLE ETMEZ; yalnızca capture dinleyicisi onları görebilir. Betik hataları
  // ise hedefi \`window\` olduğu için aynı dinleyici tarafından yakalanır.
  addEventListener(
    'error',
    function (event) {
      var target = event.target;
      if (target && target !== window && (target.src || target.href)) {
        report('resource', 'warn', target.src || target.href, String(target.tagName || '').toLowerCase());
        return;
      }

      var message = event.message || describe(event.error);
      var name = event.error && event.error.name;
      // Chromium işlenmemiş hatalarda adı zaten mesaja gömerek bildirir.
      if (name && name !== 'Error' && message.indexOf(name) === -1) message = name + ': ' + message;

      report('runtime', 'error', message, null, userLine(event.lineno), event.colno);
    },
    true,
  );

  addEventListener('unhandledrejection', function (event) {
    report('rejection', 'error', describe(event.reason));
  });

  var nativeError = console.error;
  console.error = function () {
    report('console', 'error', join(arguments));
    nativeError.apply(console, arguments);
  };

  var nativeWarn = console.warn;
  console.warn = function () {
    report('console', 'warn', join(arguments));
    nativeWarn.apply(console, arguments);
  };
})();`;
}
