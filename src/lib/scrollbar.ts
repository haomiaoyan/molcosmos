/**
 * Full-bleed layers size themselves with `calc(100vw - var(--sbw))`.
 *
 * `100vw` includes the classic scrollbar (15px in Chrome on Windows) while the
 * content box does not, so every `100vw` variant shifts such a layer 7px left
 * and makes the page 8px wider than the viewport. Publishing the measured
 * difference as `--sbw` is the only way to express "the whole visible width".
 *
 * The value is not a constant, and one of the reasons is easy to miss: at the
 * moment the inline bootstrap in `index.html` runs, the document is still
 * shorter than the viewport, so there is no scrollbar yet and the correct
 * answer *at that instant* is `0px`. The bar only appears once the app has
 * rendered enough content (measured at ~310ms on a production build). Neither
 * `useLayoutEffect` nor a `resize` listener fires for that transition — the
 * window never resized — so the layer would stay 15px too wide until the user
 * happened to resize the window.
 *
 * {@link observeScrollbarWidth} therefore also watches the document element's
 * size, which does change when a scrollbar appears.
 */

const CSS_VAR = '--sbw'

/** Reads the current scrollbar width in CSS pixels. */
export function measureScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0
  return Math.max(0, window.innerWidth - document.documentElement.clientWidth)
}

/** Writes the current scrollbar width onto `<html>` as `--sbw`. */
export function syncScrollbarWidth(): void {
  document.documentElement.style.setProperty(CSS_VAR, `${measureScrollbarWidth()}px`)
}

/**
 * Keeps `--sbw` in step with the viewport and the document's scrollability.
 *
 * Returns a disposer. Safe to call in a layout effect: it publishes a value
 * immediately, then re-publishes on every event that can change the bar.
 */
export function observeScrollbarWidth(): () => void {
  syncScrollbarWidth()

  const root = document.documentElement

  // Resizing the window can add or remove the bar.
  window.addEventListener('resize', syncScrollbarWidth)

  // A scrollbar appearing is a change in the document element's box, not a
  // window resize, so observe the box itself. Reading `clientWidth` inside the
  // callback would re-trigger the observer on every write, so compare the
  // rounded box sizes instead and bail out when they are unchanged.
  let lastWidth = root.clientWidth
  let lastHeight = root.clientHeight
  const observer =
    typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => {
          const width = root.clientWidth
          const height = root.clientHeight
          if (width === lastWidth && height === lastHeight) return
          lastWidth = width
          lastHeight = height
          syncScrollbarWidth()
        })
      : null
  observer?.observe(root)

  return () => {
    window.removeEventListener('resize', syncScrollbarWidth)
    observer?.disconnect()
  }
}
