import { dom } from '../app/dom';
import { refreshAll } from '../core/editors';

const MIN_WIDTH = 150;

let editorWidth: number | null = null;

/**
 * PointerEvent ile çalışır: fare, dokunmatik ve kalem aynı kodla sürüklenir
 * (mousedown/mousemove yalnızca fareyi yakalar).
 */
export function initResizer(): void {
  dom.resizer.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    event.preventDefault();
    dom.resizer.setPointerCapture(event.pointerId);
    dom.resizer.classList.add('active');
    dom.resultFrame.style.pointerEvents = 'none';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const container = dom.editorContainer.parentElement;
    const onMove = (moveEvent: PointerEvent): void => {
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const next = Math.max(
        MIN_WIDTH,
        Math.min(moveEvent.clientX - bounds.left, bounds.width - MIN_WIDTH),
      );
      editorWidth = next;
      dom.editorContainer.style.flex = `0 0 ${next}px`;
      dom.resultContainer.style.flex = '1 1 auto';
    };

    const onUp = (): void => {
      dom.resizer.classList.remove('active');
      dom.resizer.removeEventListener('pointermove', onMove);
      dom.resizer.removeEventListener('pointerup', onUp);
      dom.resizer.removeEventListener('pointercancel', onUp);
      dom.resultFrame.style.pointerEvents = '';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      refreshAll();
    };

    dom.resizer.addEventListener('pointermove', onMove);
    dom.resizer.addEventListener('pointerup', onUp);
    dom.resizer.addEventListener('pointercancel', onUp);
  });

  dom.resizer.addEventListener('dblclick', () => {
    editorWidth = null;
    dom.editorContainer.style.flex = '';
    dom.resultContainer.style.flex = '';
    refreshAll();
  });

  dom.resizer.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 40 : 10;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const bounds = dom.editorContainer.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    const current = editorWidth ?? dom.editorContainer.getBoundingClientRect().width;
    editorWidth = Math.max(
      MIN_WIDTH,
      Math.min(current + (event.key === 'ArrowRight' ? step : -step), bounds.width - MIN_WIDTH),
    );
    dom.editorContainer.style.flex = `0 0 ${editorWidth}px`;
    dom.resultContainer.style.flex = '1 1 auto';
    refreshAll();
  });
}
