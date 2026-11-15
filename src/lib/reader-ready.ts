/** Wait only for the opening spread, then let its final layout paint before revealing it. */
export function afterReaderImagesPaint(
  images: HTMLImageElement[],
  onReady: () => void,
): () => void {
  let cancelled = false;
  let painting = false;
  let remaining = images.length;
  let firstFrame = 0;
  let secondFrame = 0;
  let deadline = 0;
  const removeListeners: (() => void)[] = [];

  const clean = () => {
    cancelled = true;
    window.clearTimeout(deadline);
    window.cancelAnimationFrame(firstFrame);
    window.cancelAnimationFrame(secondFrame);
    removeListeners.forEach((remove) => remove());
  };
  const paint = () => {
    if (cancelled || painting) return;
    painting = true;
    window.clearTimeout(deadline);
    removeListeners.forEach((remove) => remove());
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        clean();
        onReady();
      });
    });
  };

  if (!remaining) {
    paint();
    return clean;
  }

  // Offline photos and decode failures must never leave the opening overlay stuck.
  deadline = window.setTimeout(paint, 1800);
  for (const image of images) {
    let settled = false;
    const settle = () => {
      if (cancelled || settled) return;
      settled = true;
      remaining -= 1;
      if (!remaining) paint();
    };
    const decode = () => {
      if (cancelled) return;
      if (typeof image.decode !== "function") {
        settle();
        return;
      }
      try {
        void image.decode().then(settle, settle);
      } catch {
        settle();
      }
    };
    if (image.complete) {
      decode();
    } else {
      image.addEventListener("load", decode, { once: true });
      image.addEventListener("error", settle, { once: true });
      removeListeners.push(() => {
        image.removeEventListener("load", decode);
        image.removeEventListener("error", settle);
      });
    }
  }
  return clean;
}
