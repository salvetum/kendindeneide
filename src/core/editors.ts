import CodeMirror from 'codemirror';
import type { Editor, EditorConfiguration } from 'codemirror';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/xml-fold';

import { dom } from '../app/dom';
import { EDITOR_MODES, state } from '../app/state';
import type { EditorSlot } from '../app/state';
import { editorPrefs } from './editorPrefs';
import { applyLint } from './linters';
import { currentCodeMirrorTheme } from '../ui/theme';

const instances: Partial<Record<EditorSlot, Editor>> = {};

export type ChangeHandler = (slot: EditorSlot, editor: Editor) => void;

let onChange: ChangeHandler = () => undefined;

/**
 * `foldGutter` yükleniyor ve boş bir çizgi oluşturuyor, ancak CM5'in fold
 * yardımcıları (brace/comment/indent/xml) ESM paketi altında global
 * CodeMirror'a kayıt olmadığı için hiçbir işaretçi üretilmiyor. Boş
 * çizgi göstermek yerine özellik şimdilik kapalı; `tests/` ve e2e'de
 * belgeleniyor. Ayrıntı: CHANGELOG 3.0.6.
 */
function baseOptions(slot: EditorSlot): EditorConfiguration {
  const opts: Record<string, unknown> = {
    mode: EDITOR_MODES[slot],
    theme: currentCodeMirrorTheme(),
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    highlightSelectionMatches: { showToken: /\w/u, annotateScrollbar: true },
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
foldGutter: {
      rangeFinder: CodeMirror.fold.combine(
        CodeMirror.fold.brace,
        CodeMirror.fold.indent,
        CodeMirror.fold.comment,
        CodeMirror.fold.xml,
      ),
    },
    lint: false,
    ...editorPrefs({ tabSize: state.editorTabSize, wordWrap: state.editorWordWrap }),
  };
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return opts as EditorConfiguration;
}

export function setChangeHandler(handler: ChangeHandler): void {
  onChange = handler;
}

export function createEditor(slot: EditorSlot): Editor {
  const existing = instances[slot];
  if (existing) return existing;

  const editor = CodeMirror.fromTextArea(dom.textareas[slot], baseOptions(slot));
  instances[slot] = editor;

  // Linterlar geç yüklendiği için yeni editör oluşturulurken hazır olmayabilir;
  // hazırsa hemen bağlanır (applyLint hazır değilse lint'i false bırakır).
  applyLint(editor, EDITOR_MODES[slot]);

  editor.on('change', () => onChange(slot, editor));

  return editor;
}

export function getEditor(slot: EditorSlot): Editor | undefined {
  return instances[slot];
}

export function requireEditor(slot: EditorSlot): Editor {
  const editor = instances[slot];
  if (!editor) throw new Error(`Editör bulunamadı: ${slot}`);
  return editor;
}

export function allEditors(): Editor[] {
  return Object.values(instances).filter((editor): editor is Editor => editor !== undefined);
}

/** Arama, biçimlendirme gibi işlemler hangi editörü hedefleyecek? */
export function activeEditor(): Editor | undefined {
  if (!state.separated) return instances.code;
  return instances[state.activeSlot];
}

export function refreshAll(): void {
  for (const editor of allEditors()) editor.refresh();
}

/** Linterlar yüklendikten sonra tüm editörlere lint ekler (idempotent). */
export function applyLintToAll(): void {
  for (const [slot, editor] of Object.entries(instances)) {
    if (editor) applyLint(editor, EDITOR_MODES[slot as EditorSlot]);
  }
}

export function applyThemeToEditors(): void {
  const theme = currentCodeMirrorTheme();
  for (const editor of allEditors()) editor.setOption('theme', theme);
}

/** Editör görünüm tercihi değiştiğinde yeni editörlerin de uyması için. */
export function refreshEditorOptions(): void {
  const prefs = editorPrefs({ tabSize: state.editorTabSize, wordWrap: state.editorWordWrap });
  for (const editor of allEditors()) {
    editor.setOption('tabSize', prefs.tabSize);
    editor.setOption('indentUnit', prefs.indentUnit);
    editor.setOption('lineWrapping', prefs.lineWrapping);
  }
}

/** Ayrık görünümde hangi sekmenin açık olduğunu günceller ve o pane'i gösterir. */
export function setActiveSlot(slot: EditorSlot): void {
  state.activeSlot = slot;

  dom.editorTabs.querySelector('.tab-button.active')?.classList.remove('active');
  for (const tab of dom.editorTabs.querySelectorAll<HTMLElement>('[data-editor]')) {
    tab.setAttribute('aria-selected', String(tab.dataset.editor === slot));
  }
  document.querySelector('.editor-pane.active')?.classList.remove('active');

  dom.editorTabs.querySelector(`[data-editor="${slot}"]`)?.classList.add('active');
  document.getElementById(`${slot}-pane`)?.classList.add('active');

  const editor = instances[slot];
  if (editor) {
    setTimeout(() => {
      editor.refresh();
      editor.performLint();
    }, 1);
  }
}
