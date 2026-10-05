export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): ((...args: A) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay);
  };

  debounced.cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}

/** `requestIdleCallback` yoksa `setTimeout` ile yaklaş. */
export function onIdle(fn: () => void, timeout = 2000): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(fn, { timeout });
  } else {
    setTimeout(fn, 1);
  }
}
