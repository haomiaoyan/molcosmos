/**
 * The arithmetic behind the five-station horizontal stage.
 *
 * All of it is pure and lives apart from the component for one reason: the two
 * numbers that can only be wrong in a browser — how far the track travels and
 * which card is "current" at a given scroll position — were wrong twice during
 * the v7 prototype, and both times the page still rendered. A horizontal stage
 * that does not quite reach its last card looks like a design choice, so this
 * has to be pinned by tests rather than by looking at it.
 *
 * ## The measured numbers
 *
 * `.app` is `max-width: 1180px; padding: 0 24px`, so the clipping window is the
 * content box, 1132px — not 1180, and emphatically not `innerWidth`. The track
 * is five 380px cards with 56px gaps plus its own side padding:
 *
 *   5 × 380 + 4 × 56 = 2124  (content)
 *   + 48             = 2172  (`scrollWidth`, padding included — see below)
 *   2172 − 1132      = 1040  (travel)
 *
 * The 48px is **48 left + 24 right**, not a symmetric 24: Chrome's `scrollWidth`
 * stops at the content box's right edge, so trailing padding is not counted
 * while leading padding is. Measured in Chrome: `padding: 0 24px` gives
 * `scrollWidth` 2148 and travel 1016, which leaves the last card 24px short of
 * the window's right edge. The extra leading padding is what makes this
 * arithmetic describe the pixels.
 *
 * Using `innerWidth` instead makes travel *shrink as the screen grows*: measured
 * 1040 at 1440 and 0 at 2560, i.e. a wide monitor got a frozen stage. That bug is
 * the reason `windowWidth` is a field the caller has to measure rather than
 * something this module derives.
 */

export interface StageGeometry {
  /** Total track width, including its horizontal padding (`scrollWidth`). */
  trackWidth: number
  /** Width of the clipping window; 1132 inside `.app` on a desktop. */
  windowWidth: number
  /** Number of cards. */
  cardCount: number
  /** Gap between cards, px. */
  gap: number
  /** Track horizontal padding, px. Already inside `trackWidth`; kept for callers. */
  pad: number
}

/**
 * Scroll distance per pixel travelled. 3.5 makes the 1040px journey take 3640px
 * of scroll, which is the ~1.15-viewport hold the reader approved in v7. It is a
 * pacing decision, not a derivation — shortening it to 2.5 was offered and
 * declined.
 */
export const SPAN_RATIO = 3.5

/** Floor on the pin length, in viewport heights. */
export const MIN_SPAN_RATIO = 1.5

/** How far the track has to move left to reveal its right end. Never negative. */
export function stageTravel(g: StageGeometry): number {
  // Negative travel would push the track right on first paint, opening a gap at
  // the left edge of a stage that already fits. A fit is a fit.
  return Math.max(0, g.trackWidth - g.windowWidth)
}

/**
 * How far the page scrolls while the stage is pinned.
 *
 * `trackWidth` is `scrollWidth` and therefore **already includes `pad`**;
 * subtracting the padding again would under-travel by 48px and leave the last
 * card clipped — this was the v1.1 correction recorded in the SDS.
 */
export function stageSpan(g: StageGeometry, viewportHeight: number): number {
  return Math.max(stageTravel(g) * SPAN_RATIO, viewportHeight * MIN_SPAN_RATIO)
}

export interface StageFrame {
  /** Track translation, always ≤ 0. */
  x: number
  /** Index of the card the counter should be showing. */
  activeIndex: number
  /** Progress bar width, 0..100. */
  fillPercent: number
}

const clamp = (value: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, value))

/**
 * One scroll progress → the three values the stage renders from.
 *
 * Progress is clamped here rather than trusted: ScrollTrigger reports
 * 1.0000001 at the very end of a pin on fractional device pixel ratios, and
 * unclamped that hands `floor()` an index past the last card and translates the
 * track a fraction of a pixel past its end.
 */
export function stageFrame(g: StageGeometry, progress: number): StageFrame {
  const p = clamp(progress, 0, 1)
  const lastIndex = Math.max(0, g.cardCount - 1)
  // `-0 * 0` is `-0`. It renders as "0" everywhere that matters, but it is not
  // `Object.is`-equal to 0, so the rest position would fail a deep-equal against
  // the obvious expectation. Adding zero folds it back.
  const x = -stageTravel(g) * p + 0
  return {
    x,
    activeIndex: clamp(Math.floor(p * g.cardCount), 0, lastIndex),
    fillPercent: p * 100,
  }
}
