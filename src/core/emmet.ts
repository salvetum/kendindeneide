import CodeMirror from 'codemirror';

// `emmet` paketi kendi tip dosyasını "exports" altında export etmiyor,
// bu yüzden dinamik import sonucu özel bir tiple genişletiliyor.
type EmmetModule = {
  require: (name: string) => {
    expandAbbreviation: (abbr: string, opts?: Record<string, unknown>) => string;
  };
};

let emmetCore: EmmetModule | null = null;
let emmetLoading: Promise<void> | null = null;

async function loadEmmet(): Promise<void> {
  if (emmetCore) return;
  if (emmetLoading) {
    await emmetLoading;
    return;
  }

  emmetLoading = (async () => {
    // @ts-expect-error - emmet paketi kendi tip dosyasını exports altında export etmiyor
    const mod: unknown = await import('emmet');
    emmetCore = mod as EmmetModule;
  })();

  await emmetLoading;
}

/**
 * Imlecin hemen solundaki metinden emmet kısayolunu çıkarır.
 * Kısayol en az bir emmet özel karakteri içermelidir (>, ., #, *, +, ! vb.).
 */
function getAbbreviationAtCursor(
  editor: CodeMirror.Editor,
): { abbreviation: string; from: CodeMirror.Position; to: CodeMirror.Position } | null {
  const cursor = editor.getCursor();
  const line = editor.getLine(cursor.line);
  const beforeCursor = line.slice(0, cursor.ch);

  // Emmet kısayolunda geçebilecek karakterler ([] içinde özel karakterler kaçış karakterine ihtiyaç duymaz)
  const match = beforeCursor.match(/[A-Za-z0-9>.#+*()@$!-]*$/);
  if (!match || match[0].length === 0) return null;

  const abbreviation = match[0];
  // En az bir emmet özel karakteri veya '!' içermeli
  if (!/[>.#+*()@$!-]/.test(abbreviation)) return null;

  const from: CodeMirror.Position = { line: cursor.line, ch: cursor.ch - abbreviation.length };
  const to: CodeMirror.Position = cursor;

  return { abbreviation, from, to };
}

/**
 * Emmet zaten yüklüyse senkron olarak genişletmeyi dener.
 * Başarılıysa true, emmet henüz yüklenmemişse veya kısayol değilse false döner.
 */
export function tryExpandAbbreviation(editor: CodeMirror.Editor): boolean {
  if (!emmetCore) return false;

  const abbrInfo = getAbbreviationAtCursor(editor);
  if (!abbrInfo) return false;

  try {
    const expanded = emmetCore.require('emmet').expandAbbreviation(abbrInfo.abbreviation, {
      pretty: false,
    });

    if (!expanded || expanded === abbrInfo.abbreviation) return false;

    editor.replaceRange(expanded, abbrInfo.from, abbrInfo.to);
    const newLine = editor.getLine(abbrInfo.from.line);
    editor.setCursor({ line: abbrInfo.from.line, ch: newLine.length });
    return true;
  } catch {
    return false;
  }
}

/**
 * Emmet'i yükler ve ardından kısayolu genişletir (buton / kısayol tuşu için).
 */
export async function expandAbbreviation(editor: CodeMirror.Editor): Promise<boolean> {
  await loadEmmet();
  return tryExpandAbbreviation(editor);
}

/**
 * Editöre Emmet Tab keymap'ını ekler.
 * Tab: emmet genişletme dene → olmazsa normal indent.
 * Shift+Tab: CM5 varsayılan outdent.
 */
export function attachEmmetKeymap(editor: CodeMirror.Editor): void {
  editor.addKeyMap({
    Tab: (cm) => {
      if (cm.somethingSelected()) return CodeMirror.Pass;
      if (tryExpandAbbreviation(cm)) return undefined; // işlendi
      cm.execCommand('indentMore');
      return undefined; // işlendi
    },
  });
}
