import { useLayoutEffect, useRef } from 'react'
import { gsap, registerGsap, ScrollTrigger } from '../lib/gsap'
import { useI18n, type StringKey } from '../lib/i18n'

/**
 * The five milestones on one axis.
 *
 * The chapter used to draw a private 1px rail inside every node, and each rail
 * stopped just above the next node. Five short verticals that never touch do
 * not read as "a timeline"; they read as five cards that happen to have a tick
 * on the left. One line, grown from the first marker to the last, does.
 *
 * ## Three measured decisions
 *
 * **The line's ends are measured, never guessed.** Spanning the list's own box
 * would run the line past the final dot by the whole height of that node's card
 * body, so the timeline would appear to continue past 2025. `layout()` therefore
 * pins it between the vertical centre of the first marker and that of the last.
 * It reads those two centres only: the reveal translates nodes on `x`, so a
 * transform that is live mid-scrub cannot move a centre vertically and skew the
 * measurement.
 *
 * **A `ResizeObserver` on the root, not a window `resize` listener.** Switching
 * the page from Chinese to English rewrites every node and changes the list's
 * height by a line or two without the window ever resizing; the axis would keep
 * the span it measured in the other language and stop at the wrong place.
 *
 * **The reveal window opens one segment *before* its node.** Markers sit at
 * `i / (count - 1)`, so a window that opens at the node's own marker gives the
 * last one the range `[1, 1.25]`: clamped at `p = 1` it never arrives, and it
 * sits 12px right and dim for the whole visit. Opening one segment early also
 * makes the first node already arrived at `p = 0`, which is right — it is the
 * origin of the axis, and there is no earlier line for it to emerge from.
 */

/** Above this the axis is scrubbed; at or below it the axis is simply drawn. */
export const AXIS_BREAKPOINT_PX = 768

/** How far a node travels while arriving, px. Matches the SDS's "left 12px". */
const AXIS_SHIFT_PX = 12

export interface AxisNode {
  readonly key: string
  readonly year: StringKey
  readonly title: StringKey
  readonly body: StringKey
  /** Marks the two foundational results the rest of the field rests on. */
  readonly foundation?: boolean
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value)

/**
 * How far node `index` has arrived, 0..1, at axis progress `progress`.
 *
 * Smoothstep rather than the linear ramp: with five nodes a linear window makes
 * each label jump from still to moving inside a single frame at the boundary,
 * which at this spacing reads as a cut rather than as an arrival. The curve is
 * one line of arithmetic, so it costs less than keeping five tweens alive and
 * killing them again on every breakpoint change.
 *
 * Exported for `timelineAxis.test.ts`: the `start = (index - 1) * step` term is
 * the one that is easy to get wrong (dropping it makes the last node unreachable)
 * and it fails silently — the page renders, four nodes arrive, the fifth simply
 * stays 12px to the right and dim.
 */
export function revealAt(index: number, count: number, progress: number): number {
  if (count <= 1) return 1
  const step = 1 / (count - 1)
  const start = (index - 1) * step
  const local = clamp01((progress - start) / step)
  return local * local * (3 - 2 * local)
}

export function TimelineAxis({ nodes }: { nodes: readonly AxisNode[] }) {
  const { t } = useI18n()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLOListElement | null>(null)
  const lineRef = useRef<HTMLSpanElement | null>(null)

  const count = nodes.length

  useLayoutEffect(() => {
    const root = rootRef.current
    const list = listRef.current
    const line = lineRef.current
    if (!root || !list || !line) return

    const items = Array.from(list.children) as HTMLElement[]

    /** Pins the line between the first and the last marker, in root coordinates. */
    const layout = () => {
      const markers = items.map((item) => item.querySelector<HTMLElement>('.timeline__marker'))
      const first = markers[0]
      const last = markers[markers.length - 1]
      if (!first || !last) return
      const rootTop = root.getBoundingClientRect().top
      const a = first.getBoundingClientRect()
      const b = last.getBoundingClientRect()
      const top = a.top + a.height / 2 - rootTop
      const bottom = b.top + b.height / 2 - rootTop
      line.style.top = `${top}px`
      line.style.height = `${Math.max(0, bottom - top)}px`
    }

    /** Writes one scrubbed progress to the line and to all five nodes. */
    const write = (raw: number) => {
      const progress = clamp01(raw)
      line.style.transform = `scaleY(${progress})`
      for (let i = 0; i < items.length; i += 1) {
        const local = revealAt(i, count, progress)
        const item = items[i]
        // Clearing at exactly 1 hands the final state back to the stylesheet, so
        // a node that has arrived carries no inline style at all — the same
        // state the reduced-motion reader sees, and one less thing to go stale.
        item.style.opacity = local === 1 ? '' : String(local)
        item.style.transform =
          local === 1 ? '' : `translate3d(${(1 - local) * AXIS_SHIFT_PX}px, 0, 0)`
      }
    }

    /**
     * Drops every inline style this component wrote.
     *
     * `gsap.context.revert()` only reverts properties gsap itself set, and these
     * are raw `style` writes. Without this, dragging a window across 768px kills
     * the trigger and leaves the last four nodes at `opacity: 0` on the phone
     * that is now displaying them — invisible milestones, with no motion left
     * to bring them back. "Motion may stop, information may not" is not a
     * statement about the branch that happens to run.
     */
    const reset = () => {
      line.style.transform = ''
      items.forEach((item) => {
        item.style.opacity = ''
        item.style.transform = ''
      })
    }

    layout()

    // Explicit, even though other components on the page register too: this
    // chapter is reachable by URL fragment alone, and the guard in `lib/gsap.ts`
    // makes a second call free. Nothing here imports from `'gsap'` directly.
    registerGsap()

    // Guarded because `motion.ts` guards `matchMedia` for the same reason: this
    // module is imported by tests and by code that can run before the DOM APIs
    // exist, and one missing observer must not cost the whole axis.
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => layout())
      observer.observe(root)
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      // Both halves of the query are load-bearing. Narrow: an axis that grows
      // inside a 24px gutter on a phone is motion the reader has to chase, and
      // the SDS asks for a plain gutter line there. Reduced motion: no trigger
      // at all, so nothing is ever left at opacity 0 (the stylesheet's final
      // state is the only state).
      mm.add(
        `(min-width: ${AXIS_BREAKPOINT_PX}px) and (prefers-reduced-motion: no-preference)`,
        () => {
          // Same proxy pattern as `StationStage`: `scrub` smooths an
          // *animation*, not a trigger, so the trigger needs one to lag behind
          // the scrollbar. Writing from the proxy's `onUpdate` — rather than
          // from the trigger's — is what keeps the labels in lockstep with the
          // line. Driven from `self.progress` the labels run up to half a second
          // ahead of the line they are supposed to be emerging from.
          const proxy = { p: 0 }
          const tween = gsap.to(proxy, {
            p: 1,
            ease: 'none',
            duration: 1,
            paused: true,
            onUpdate: () => write(proxy.p),
          })

          const trigger = ScrollTrigger.create({
            trigger: root,
            // A whole-chapter band: the line grows while the reader is still
            // arriving and is complete by the time the last card is fully in
            // view. The range is `H + 0.16vh` of scroll for a chapter `H` tall
            // (`bottom 62%` starts 0.16vh after `top 78%` and then the whole
            // element has to pass), so it is positive at any height and cannot
            // invert — which is the one way a scrub silently becomes a jump to
            // its end value.
            start: 'top 78%',
            end: 'bottom 62%',
            scrub: 0.5,
            invalidateOnRefresh: true,
            animation: tween,
            onRefresh: () => {
              // Re-measured on every refresh, so a language switch, a font swap
              // or a resize cannot leave the line spanning the old height.
              layout()
              // `proxy.p` is the settled value ScrollTrigger just wrote back
              // into the tween, so this repaints at the right progress instead
              // of jumping to 0 for a frame.
              write(proxy.p)
            },
          })

          return () => {
            trigger.kill()
            tween.kill()
            reset()
          }
        },
      )
    }, root)

    return () => {
      observer?.disconnect()
      ctx.revert()
      // Belt and braces: `ctx.revert()` runs the matchMedia cleanup above,
      // which already calls `reset()`, but that only happens if the query had
      // matched. Calling it here as well costs nothing and makes the invariant
      // ("this component leaves no inline styles behind") hold unconditionally.
      reset()
    }
    // Only the node count changes the geometry or the reveal windows. The copy
    // comes from i18n and re-renders without rebuilding the trigger; a rebuild
    // on a language switch would also reset every node to opacity 0.
  }, [count])

  return (
    <div className="timeline-axis" ref={rootRef}>
      {/* Decoration only: the axis repeats the order the <ol> already carries,
          and a screen reader announcing "line" between milestones is noise. */}
      <span className="timeline-axis__line" ref={lineRef} aria-hidden="true" />
      <ol className="timeline" ref={listRef}>
        {nodes.map((node) => (
          <li
            key={node.key}
            className={`timeline__item${node.foundation ? ' timeline__item--foundation' : ''}`}
          >
            <span className="timeline__marker" aria-hidden="true" />
            <div className="timeline__card">
              <p className="timeline__year mono">{t(node.year)}</p>
              <h3 className="timeline__title">{t(node.title)}</h3>
              <p className="timeline__body">{t(node.body)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
