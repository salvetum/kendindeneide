export type Lang = 'tr' | 'en';
export type Theme = 'dark' | 'light';
export type LibraryKey = 'jQuery' | 'bootstrap' | 'react' | 'vue';
export type EditorMode = 'htmlmixed' | 'text/html' | 'css' | 'javascript';
export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type PrettierParser = 'html' | 'css' | 'babel';

/** Ayarlar panelindeki bir anahtar. */
export type SettingKey = 'saveCodeEnabled' | 'autoRunEnabled' | LibraryKey | Lang;

export interface LibraryDefinition {
  readonly name: string;
  readonly styles?: readonly string[];
  readonly scripts?: readonly string[];
}

export interface ParsedCode {
  readonly htmlCode: string;
  readonly cssCode: string;
  readonly jsCode: string;
}
