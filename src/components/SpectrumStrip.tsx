import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CLASS_COLORS, CLASS_LABEL_KEYS, statsFor, type MoleculeClass } from '../lib/galaxy'
import { useI18n } from '../lib/i18n'
import { prefersReducedMotion } from '../lib/motion'
import type { Molecule } from '../lib/molecule'

/**
 * The universe census, drawn to scale.
 *
 * The section used to be four equal-width cards, and that was not a subtle
 * inaccuracy: measured on the default weights the real split is
 *
 *   goldilocks  53/600 =  8.8%
 *   candidate  371/600 = 61.8%
 *   lead       174/600 = 29.0%
 *   far          2/600 =  0.33%
 *
 * so the rarest class — the two molecules at the edge of the universe — was
 * drawn the same size as the 371 that dominate it. A chart that says "these are
 * comparable" when one is 185× the other is worse than no chart. This one is a
 * single proportional bar.
 */

/** Draw order, brightest classification first. Local because galaxy.ts is frozen. */
const CLASS_ORDER: readonly MoleculeClass[] = ['goldilocks', 'candidate', 'lead', 'far']

/**
 * Smallest segment worth drawing, in percent.
 *
 * At 0.33% a segment is about 4px on a 1132px bar — visible as a line, which is
 * the honest rendering of "two molecules out of six hundred". Below that the
 * browser rounds it away and the class silently disappears from the page, so
 * the floor exists to keep it on screen, not to flatter it.
 */
export const MIN_SEGMENT = 0.33

/**
 * Counts → percentage widths that always sum to 100.
 *
 * Three rules, and the third is the one that is easy to miss:
 *
 * 1. A class with **zero** molecules gets **zero** width. Lifting it to the
 *    minimum would paint a coloured segment with nothing behind it — the exact
 *    misreading this chart replaces.
 * 2. A class with a count but a share below `MIN_SEGMENT` is lifted to it.
 * 3. Lifting pushes the total past 100 (measured: `[53, 371, 174, 1]` becomes
 *    100.163%), so everything is then scaled back to 100. Skipping this step
 *    overflows the bar and the last segment is clipped, which is how a
 *    legitimate 0.3% class vanishes.
 *
 * Pure, and exported for the tests: this is the only part of the chart that can
 * be wrong without looking wrong.
 */
export function segmentWidths(counts: readonly number[]): number[] {
  const total = counts.reduce((a, b) => a + b, 0)
  // Also guards the division below. An empty catalogue is a real state during
  // the first paint, not a hypothetical.
  if (total <= 0) return counts.map(() => 0)

  const lifted = counts.map((count) => {
    if (count <= 0) return 0
    return Math.max(MIN_SEGMENT, (count / total) * 100)
  })

  const liftedSum = lifted.reduce((a, b) => a + b, 0)
  if (liftedSum <= 0) return counts.map(() => 0)
  return lifted.map((w) => (w / liftedSum) * 100)
}

export function SpectrumStrip({ molecules }: { molecules: readonly Molecule[] }) {
  const { t } = useI18n()

  // Derived, never hardcoded: the sandbox drags `weights`, which re-scores the
  // catalogue, which changes these counts. A literal 53/371/174/2 would be a
  // chart that stops matching the galaxy the moment anyone touches the sliders.
  const stats = useMemo(() => statsFor(molecules), [molecules])
  const widths = useMemo(
    () => segmentWidths(CLASS_ORDER.map((cls) => stats.byClass[cls])),
    [stats],
  )

  // The segment widths are the one thing that should grow into place; everything
  // else on the page already has an entrance. Driven by a CSS animation with a
  // `from { width: 0 }` keyframe rather than a transition, so that a later
  // weight change (the slider) snaps immediately instead of easing for 600ms
  // while the reader is still dragging.
  //
  // Reduced motion skips even that: the media query kills the animation and the
  // bar renders at its final width on the first paint.
  const [entered, setEntered] = useState(() => prefersReducedMotion())
  useEffect(() => {
    if (entered) return
    // One frame, so the browser has a chance to paint the zero-width state the
    // animation starts from; setting it in the same commit skips the animation.
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [entered])

  // Composed from existing keys rather than added to i18n: the numbers are
  // derived data and must never be baked into a translation string, and the four
  // class labels are already translated.
  const ariaLabel = useMemo(
    () =>
      [stats.total, ...CLASS_ORDER.map((cls) => `${t(CLASS_LABEL_KEYS[cls])} ${stats.byClass[cls]}`)].join(
        ' · ',
      ),
    [stats, t],
  )

  return (
    <div className="spectrum">
      <div className="spectrum__bar" role="img" aria-label={ariaLabel}>
        {CLASS_ORDER.map((cls, i) => (
          <span
            key={cls}
            className={`spectrum__seg spectrum__seg--${cls}`}
            style={
              {
                '--w': `${entered ? widths[i] : 0}%`,
                background: CLASS_COLORS[cls],
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* The counts live here as text as well as in the bar: a 4px segment is
          readable by a screen reader and by nobody else, and the bar alone
          carries the ratio but not the absolute numbers.
          The four entries are cards, not plain rows, so the supplied hover
          effect has something to focus: `:hover > :not(:hover)` blurs the
          siblings without any JavaScript. */}
      <ul className="spectrum__legend" data-focusable="true">
        {CLASS_ORDER.map((cls) => (
          <li key={cls} className="spectrum__legend-item">
            <p className="spectrum__legend-head">
              <span
                className="spectrum__swatch"
                style={{ background: CLASS_COLORS[cls] }}
                aria-hidden="true"
              />
              <b style={{ color: CLASS_COLORS[cls] }}>{t(CLASS_LABEL_KEYS[cls])}</b>
              <span className="spectrum__count mono">{stats.byClass[cls]}</span>
            </p>
            {/* The four blurbs used to be the card bodies. They stay: the
                project's hard rule is that reduced motion may remove movement
                but never information, and the same rule applies to a redesign. */}
            <p className="spectrum__note">{t(`stats.${cls}.body` as const)}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
