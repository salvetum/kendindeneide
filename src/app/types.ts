export type Lang = 'tr' | 'en';
export type Theme = 'dark' | 'light';
export type LibraryKey = 'jQuery' | 'bootstrap' | 'react' | 'vue';
export type EditorMode = 'htmlmixed' | 'text/html' | 'css' | 'javascript';
export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type PrettierParser = 'html' | 'css' | 'babel';

/** Kod editörü yazı tipi boyutu. */
export type EditorFontSize = 'small' | 'medium' | 'large';

/** Sekme (indent) genişliği. */
export type EditorTabSize = '2' | '4';

/** Ayarlar panelindeki bir anahtar. */
export type SettingKey =
  | 'saveCodeEnabled'
  | 'autoRunEnabled'
  | 'editorWordWrap'
  | LibraryKey
  | Lang
  | EditorFontSize
  | EditorTabSize;

/** Açılır listeden seçilen ayarlar. */
export type ChoiceSettingKey = 'editorFontSize' | 'editorTabSize';

/** Açık/kapa düğmesi olan ayarlar. */
export type ToggleSettingKey = Extract<
  SettingKey,
  'saveCodeEnabled' | 'autoRunEnabled' | 'editorWordWrap'
>;

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
