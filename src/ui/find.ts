/**
 * Arama ve değiştir.
 *
 * CodeMirror 5'in `searchcursor` eklentisi üzerine kuruludur; kendi
 * iletişim kutusu (`addon/dialog/search`) yerine uygulamanın tasarımına
 * uyan bir çubuk kullanılır. Çubuk editör kabının üstünde durur, bu
 * yüzden hedef editör `activeEditor()` ile belirlenir.
 *
 * API notu: `SearchCursor.findNext()` / `findPrevious()` bir nesne
 * DEĞİL, eşleşme bulunduğunu söyleyen bir değer döndürür; konumlar
 * `cursor.from()` ve `cursor.to()` metotlarıyla okunur. (Ayrıca
 * `@types/codemirror` bu arayüzü `boolean | RegExpMatchArray` diye
 * tanımlıyor, bu yüzden imleç için yerel bir arayüz kullanılıyor.)
 */

import { Pos } from 'codemirror';
import 'codemirror/addon/search/searchcursor';
import type { Editor, Position } from 'codemirror';

import { dom } from '../app/dom';
import { t } from '../app/i18n';
import { state } from '../app/state';
import { activeEditor } from '../core/editors';
import { showToast } from './toast';

interface Cursor {
  findNext(): unknown;
  findPrevious(): unknown;
  from(): Position | undefined;
  to(): Position | undefined;
}

/** Sayım için üst sınır; devasa dosyalarda donmayı önler. */
const MAX_MATCHES = 5000;

interface SearchSession {
  readonly editor: Editor;
  cursor: Cursor;
  readonly query: string;
}

let session: SearchSession | null = null;

function newCursor(editor: Editor, query: string): Cursor {
  return editor.getSearchCursor(query, Pos(0, 0), false);
}

/** Eşleşme bulunduysa konum aralığını döndürür. */
function rangeOf(cursor: Cursor): { from: Position; to: Position } | null {
  const from = cursor.from();
  const to = cursor.to();
  return from && to ? { from, to } : null;
}

function currentQuery(): string {
  return dom.findInput.value;
}

function renderCount(total: number, index: number): void {
  const lang = state.lang;
  dom.findCount.textContent =
    total === 0 ? t(lang, 'findNoResults') : t(lang, 'findCount', String(index), String(total));
  dom.findCount.classList.toggle('is-empty', total === 0);
}

/**
 * Aramayı yeniden başlatır ve ilk eşleşmeyi seçer.
 *
 * Sayım ve gezinme AYRI imleçlerle yapılır: tek imleç kullanılırsa
 * sayım döngüsü onu tüketir ve "sonraki eşleşme" çalışmaz.
 */
function runSearch(options: { readonly select: boolean }): void {
  const editor = activeEditor();
  if (!editor) return;

  const query = currentQuery();
  session = null;

  if (query === '') {
    renderCount(0, 0);
    return;
  }

  let total = 0;
  const counter = newCursor(editor, query);
  while (counter.findNext() && total < MAX_MATCHES) total += 1;

  if (options.select && total > 0) {
    const first = newCursor(editor, query);
    if (first.findNext()) {
      const range = rangeOf(first);
      if (range) {
        editor.setSelection(range.from, range.to);
        editor.scrollIntoView({ from: range.from, to: range.to }, 40);
      }
    }
  }

  session = { editor, cursor: newCursor(editor, query), query };
  renderCount(total, total > 0 ? 1 : 0);
}

function gotoMatch(direction: 1 | -1): void {
  if (!session) {
    runSearch({ select: true });
    return;
  }
  const { editor } = session;

  if (direction === 1 ? session.cursor.findNext() : session.cursor.findPrevious()) {
    const range = rangeOf(session.cursor);
    if (range) {
      editor.setSelection(range.from, range.to);
      editor.scrollIntoView({ from: range.from, to: range.to }, 40);
      return;
    }
  }

  // Sondan başa (veya baştan sona) dön.
  session.cursor = newCursor(editor, session.query);
  const found = direction === 1 ? session.cursor.findNext() : session.cursor.findPrevious();
  const range = found ? rangeOf(session.cursor) : null;
  if (!range) {
    showToast(t(state.lang, 'findNoResults'), 'warning');
    return;
  }
  editor.setSelection(range.from, range.to);
  editor.scrollIntoView({ from: range.from, to: range.to }, 40);
  showToast(t(state.lang, 'findWrapped'), 'info');
}

function replaceOne(): void {
  if (!session) return;
  const editor = session.editor;

  // Seçili metin arama terimiyle birebir aynıysa değiştir; değilse
  // önce bir sonraki eşleşmeye git (klavyeyle gezinmek gibi).
  if (editor.getSelection() !== session.query) {
    gotoMatch(1);
    return;
  }

  editor.replaceSelection(dom.replaceInput.value, 'around', 'end');
  runSearch({ select: false });
  gotoMatch(1);
}

function replaceAll(): void {
  const editor = activeEditor();
  const query = currentQuery();
  if (!editor || query === '') return;

  const replacement = dom.replaceInput.value;
  let count = 0;

  editor.operation(() => {
    // Önce TÜM eşleşmeleri topla, sonra sondan başa doğru değiştir.
    // İleri doğru değiştirirken eşleşme uzunluğu değişince sonraki
    // konumlar kayıyor ve arama yarıda kalıyor.
    const cursor = newCursor(editor, query);
    const ranges: { from: Position; to: Position }[] = [];
    while (cursor.findNext()) {
      const range = rangeOf(cursor);
      if (range) ranges.push(range);
    }
    for (let i = ranges.length - 1; i >= 0; i -= 1) {
      const target = ranges[i];
      if (target) editor.replaceRange(replacement, target.from, target.to, 'around');
      count += 1;
    }
  });

  showToast(t(state.lang, 'findReplaced', String(count)), count > 0 ? 'success' : 'info');
  runSearch({ select: false });
}

export function isFindbarOpen(): boolean {
  return !dom.findbar.hidden;
}

export function openFindbar(options: { readonly focusReplace: boolean }): void {
  dom.findbar.hidden = false;
  const editor = activeEditor();
  // Editörde seçili metin varsa arama kutusuna taşı, klasik davranış.
  const selected = editor?.getSelection() ?? '';
  if (selected && !selected.includes('\n')) dom.findInput.value = selected;
  runSearch({ select: true });

  const target = options.focusReplace ? dom.replaceInput : dom.findInput;
  target.focus();
  target.select();
}

export function closeFindbar(): void {
  dom.findbar.hidden = true;
  session = null;
  const editor = activeEditor();
  if (editor) editor.focus();
  renderCount(0, 0);
}

export function initFindbar(): void {
  dom.findInput.addEventListener('input', () => runSearch({ select: false }));
  dom.findInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      gotoMatch(event.shiftKey ? -1 : 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeFindbar();
    }
  });

  dom.replaceInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      replaceOne();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeFindbar();
    }
  });

  dom.findNext.addEventListener('click', () => gotoMatch(1));
  dom.findPrev.addEventListener('click', () => gotoMatch(-1));
  dom.replaceOne.addEventListener('click', replaceOne);
  dom.replaceAll.addEventListener('click', replaceAll);
  dom.findClose.addEventListener('click', closeFindbar);
}
