import CodeMirror from 'codemirror';
import type { Editor, EditorConfiguration } from 'codemirror';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/css/css';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/search/match-highlighter';
// dracula / eclipse temaları saf CSS'tir; src/styles/main.css içinden yüklenir.

import { dom } from '../app/dom';
import { EDITOR_MODES, state } from '../app/state';
import type { EditorSlot } from '../app/state';
import { applyLint } from './linters';
import { currentCodeMirrorTheme } from '../ui/theme';

const instances: Partial<Record<EditorSlot, Editor>> = {};

export type ChangeHandler = (slot: EditorSlot, editor: Editor) => void;

let onChange: ChangeHandler = () => undefined;

function baseOptions(slot: EditorSlot): EditorConfiguration {
  return {
    mode: EDITOR_MODES[slot],
    theme: currentCodeMirrorTheme(),
    lineNumbers: true,
    autoCloseTags: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    highlightSelectionMatches: { showToken: /\w/u, annotateScrollbar: true },
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
    // Linterlar lazy yüklendiği için başlangıçta kapalı; init sonrası açılır.
    lint: false,
  };
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
