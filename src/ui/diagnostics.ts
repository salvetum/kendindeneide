import { dom } from '../app/dom';
import { t } from '../app/i18n';
import { state } from '../app/state';
import { isDiagnosticReport } from '../core/diagnostics';
import type { DiagnosticReport } from '../core/diagnostics';

/** Sonsuz büyüyen bir günlük yerine son N kayıt tutulur. */
const MAX_ENTRIES = 100;

/**
 * `ICONS.error`/`ICONS.warning` yerine burada kendi ikonları kullanılıyor:
 * ortak ikonların `style="color: var(--red)"` gibi satır içi renkleri var ve
 * uyarı girdisinde yanlış rengi basardı. Buradaki ikonlar `currentColor`
 * mirası alır, rengi `.diagnostics-entry.<level>` belirler.
 */
const LEVEL_ICONS = {
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  warn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
} as const;

let entries: DiagnosticReport[] = [];
let collapsed = false;

function describe(report: DiagnosticReport): string {
  if (report.kind === 'resource') {
    return t(state.lang, 'diagnosticsResource', report.tag ?? 'link', report.text);
  }
  if (report.kind === 'rejection') {
    return `${t(state.lang, 'diagnosticsRejection')}: ${report.text}`;
  }
  return report.text;
}

function createEntry(report: DiagnosticReport): HTMLLIElement {
  const item = document.createElement('li');
  item.className = `diagnostics-entry ${report.level}`;

  const badge = document.createElement('span');
  badge.className = 'diagnostics-badge';
  badge.innerHTML = report.level === 'error' ? LEVEL_ICONS.error : LEVEL_ICONS.warn;

  const text = document.createElement('span');
  text.className = 'diagnostics-text';
  text.textContent = describe(report);

  item.append(badge, text);

  // Satır bilgisi yalnızca kullanıcının script'inden gelen hatalarda anlamlı.
  if (report.line !== null) {
    const position = document.createElement('span');
    position.className = 'diagnostics-at';
    position.textContent = `${report.line}:${report.column ?? 0}`;
    item.append(position);
  }

  return item;
}

export function renderDiagnostics(): void {
  const errors = entries.filter((entry) => entry.level === 'error').length;
  dom.diagnosticsSummary.textContent = t(
    state.lang,
    'diagnosticsSummary',
    String(errors),
    String(entries.length - errors),
  );

  dom.diagnosticsList.replaceChildren(...entries.map(createEntry));
  dom.diagnostics.hidden = entries.length === 0;
  dom.diagnostics.classList.toggle('collapsed', collapsed);
  dom.diagnosticsToggle.setAttribute('aria-expanded', String(!collapsed));
}

/** Yeni çalıştırmada eski hatalar bayatlaşır; panel sıfırlanır. */
export function clearDiagnostics(): void {
  if (entries.length === 0) return;
  entries = [];
  renderDiagnostics();
}

export function initDiagnostics(): void {
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    // Blob URL'in kaynağı opaque ("null") olduğu için origin ile doğrulanamaz.
    // Kaynak pencere + kanal adı birlikte yeterlidir: iframe'ten başka bir
    // pencere bu pencereye mesaj gönderemez.
    if (!dom.resultFrame.src.startsWith('blob:')) return;
    if (event.source !== dom.resultFrame.contentWindow) return;
    if (!isDiagnosticReport(event.data)) return;

    entries.push(event.data);
    if (entries.length > MAX_ENTRIES) entries = entries.slice(-MAX_ENTRIES);
    renderDiagnostics();
  });

  dom.diagnosticsToggle.addEventListener('click', () => {
    collapsed = !collapsed;
    renderDiagnostics();
  });

  dom.diagnosticsClear.addEventListener('click', () => {
    entries = [];
    renderDiagnostics();
  });

  renderDiagnostics();
}
