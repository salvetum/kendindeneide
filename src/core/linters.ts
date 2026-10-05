import 'codemirror/addon/lint/lint';

import { Pos } from 'codemirror';
import type { Editor } from 'codemirror';
import type { Annotation, SyncLintStateOptions } from 'codemirror/addon/lint/lint';
import type { EditorMode } from '../app/types';

import jshintUrl from 'jshint/dist/jshint.js?url';
import csslintUrl from 'csslint/dist/csslint.js?url';
import htmlhintUrl from 'htmlhint/dist/htmlhint.js?url';

interface JshintError {
  line: number;
  character: number;
  reason: string;
  code: string | null;
}

interface JshintApi {
  (source: string, options?: unknown): boolean;
  errors: (JshintError | null)[] | null;
}

interface CssLintMessage {
  type: string;
  line: number;
  col: number;
  message: string;
}

interface CssLintApi {
  verify(css: string, ruleset?: unknown): CssLintMessage[];
}

interface HtmlHintMessage {
  message: string;
  line: number;
  col: number;
  rule?: { id?: string; severity?: string };
}

interface HtmlHintApi {
  defaultRuleset: unknown;
  verify(html: string, ruleset?: unknown): HtmlHintMessage[];
}

declare global {
  interface Window {
    JSHINT?: JshintApi;
    CSSLint?: CssLintApi;
    HTMLHint?: HtmlHintApi;
  }
}

export const JSHINT_OPTIONS = {
  esversion: 2021,
  globals: {
    document: true,
    window: true,
    console: true,
    alert: true,
    prompt: true,
    confirm: true,
    fetch: true,
    setTimeout: true,
    setInterval: true,
    clearTimeout: true,
    clearInterval: true,
    localStorage: true,
    jQuery: false,
    bootstrap: false,
    React: false,
    ReactDOM: false,
    Vue: false,
  },
} as const;

/* ------------------------------------------------------------------ */
/* Linter yükleme (lazy)                                              */
/* ------------------------------------------------------------------ */

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error(`Linter yüklenemedi: ${src}`)));
    document.head.appendChild(script);
  });
}

let loading: Promise<void> | null = null;

/**
 * JSHint + CSSLint + HTMLHint yalnızca ilk ihtiyaçta yüklenir; ilk yükleme
 * ~670 KB'a düşer. Aynı anda birden fazla çağrıldığında tek istek yapılır.
 */
export function ensureLinters(): Promise<void> {
  loading ??= Promise.all([loadScript(jshintUrl), loadScript(csslintUrl), loadScript(htmlhintUrl)])
    .then(() => undefined)
    .catch((error: unknown) => {
      loading = null;
      throw error;
    });
  return loading;
}

export function areLintersReady(): boolean {
  return Boolean(window.JSHINT && window.CSSLint && window.HTMLHint);
}

/* ------------------------------------------------------------------ */
/* Annotation eşleyicileri (saf, test edilebilir)                     */
/* ------------------------------------------------------------------ */

export function mapJshintErrors(errors: readonly (JshintError | null)[]): Annotation[] {
  return errors
    .filter((error): error is JshintError => error !== null)
    .map((error) => ({
      message: error.reason,
      severity: error.code ? 'warning' : 'error',
      from: Pos(error.line - 1, error.character),
      to: Pos(error.line - 1, error.character + 1),
    }));
}

export function mapCssLintMessages(messages: readonly CssLintMessage[]): Annotation[] {
  return messages.map((message) => ({
    message: message.message,
    severity: message.type === 'error' ? 'error' : 'warning',
    from: Pos(message.line - 1, Math.max(0, message.col - 1)),
    to: Pos(message.line - 1, Math.max(1, message.col)),
  }));
}

export function mapHtmlHintMessages(messages: readonly HtmlHintMessage[]): Annotation[] {
  return messages.map((message) => ({
    message: message.message,
    severity: message.rule?.severity === 'error' ? 'error' : 'warning',
    from: Pos(Math.max(0, message.line - 1), Math.max(0, message.col - 1)),
    to: Pos(Math.max(0, message.line - 1), Math.max(1, message.col)),
  }));
}

/* ------------------------------------------------------------------ */
/* CodeMirror lint glue                                               */
/* ------------------------------------------------------------------ */

/**
 * Linterlar henüz yüklenmediyse `false` döner; CodeMirror bu durumda hiç
 * lint çağrısı yapmaz. Yüklenince editörler yeniden yapılandırılır.
 */
export function lintOptionFor(mode: EditorMode): false | SyncLintStateOptions<unknown> {
  if (!areLintersReady()) return false;

  if (mode === 'javascript' && window.JSHINT) {
    const jshint = window.JSHINT;
    return {
      async: false,
      getAnnotations: (code) => {
        jshint(code, JSHINT_OPTIONS);
        return mapJshintErrors(jshint.errors ?? []);
      },
    };
  }

  if (mode === 'css' && window.CSSLint) {
    return {
      async: false,
      getAnnotations: (code) => mapCssLintMessages(window.CSSLint!.verify(code)),
    };
  }

  if ((mode === 'htmlmixed' || mode === 'text/html') && window.HTMLHint) {
    return {
      async: false,
      getAnnotations: (code) => mapHtmlHintMessages(window.HTMLHint!.verify(code)),
    };
  }

  return false;
}

export function modeSupportsLint(mode: EditorMode): boolean {
  return mode === 'javascript' || mode === 'css' || mode === 'htmlmixed' || mode === 'text/html';
}

export function applyLint(editor: Editor, mode: EditorMode): void {
  const option = lintOptionFor(mode);
  editor.setOption('lint', modeSupportsLint(mode) ? option : false);
  if (option !== false) editor.performLint();
}
