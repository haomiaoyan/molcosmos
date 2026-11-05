import { useLayoutEffect, useRef } from 'react'
import { gsap, registerGsap, ScrollTrigger } from '../lib/gsap'
import { stageFrame, stageSpan, type StageGeometry } from '../lib/useStageTravel'
import { useI18n } from '../lib/i18n'

/**
 * The five stations as one horizontal stage.
 *
 * The section used to be five equal cards in a grid — the same composition as
 * the three chapters around it — so nothing told the reader that this chapter
 * is different. Walking sideways through it does, and it is the only place on
 * the page where scroll moves something horizontally.
 *
 * ## Three measured decisions
 *
 * `start: 'top 64px'`, not `'top top'`: `.topnav` is `top: 3px`, 56px tall and
 * `z-index: 50`, so a pin beginning at the viewport top has its first 59px
 * covered by the nav. Measured on the real page, the station headings sat
 * underneath it for the whole pin.
 *
 * `.stage-pin` is `calc(100vh - 64px)`, not `100vh`, for the same reason at the
 * other end: pinned at y = 64, a full-height stage hangs 64px below the fold and
 * its own progress bar — the thing that says "keep scrolling, this is going
 * somewhere" — is never visible.
 *
 * The travel and span maths live in `lib/useStageTravel.ts`: those are the
 * numbers that can be wrong without looking wrong, so they are unit-tested
 * instead of eyeballed.
 */

/** Height of the fixed nav plus its offset; also the pin's start line. */
export const STAGE_TOP_PX = 64

/**
 * Below this the stage is a normal vertical list with no trigger at all.
 *
 * 768 rather than 640 because five 380px cards in a horizontal strip need room
 * to show that there is more inside; a 700px window would show one card and a
 * sliver, which reads as a layout bug rather than as a gallery.
 */
export const STAGE_BREAKPOINT_PX = 768

export type StationKey = 's1' | 's2' | 's3' | 's4' | 's5'

export interface Station {
  readonly step: string
  readonly key: StationKey
  readonly accent: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function StationStage({ stations }: { stations: readonly Station[] }) {
  const { t } = useI18n()
  const pinRef = useRef<HTMLDivElement | null>(null)
  const windowRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLOListElement | null>(null)
  const counterRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)

  const total = stations.length

  useLayoutEffect(() => {
    const pin = pinRef.current
    const frameWindow = windowRef.current
    const track = trackRef.current
    if (!pin || !frameWindow || !track) return

    registerGsap()

    // `matchMedia` rather than `if (innerWidth >= 768)` because it also *undoes*
    // itself: rotating a phone or dragging a window across the breakpoint tears
    // the pin down and rebuilds it. A plain branch leaves a pinned stage on a
    // narrow screen until reload — exactly the failure that assertion T6 is
    // there to catch.
    //
    // The reduced-motion half of the query is what makes T8 hold: a reader who
    // asked for less motion gets no trigger at all, so no pin, no scrub, no
    // transform. The cards stack (CSS) and every one of them is present and
    // fully opaque; "motion may stop, information may not" is not negotiable at
    // the one chapter that would otherwise need scrolling sideways to read.
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(
        `(min-width: ${STAGE_BREAKPOINT_PX}px) and (prefers-reduced-motion: no-preference)`,
        () => {
          /**
           * Measured, never derived from `innerWidth`.
           *
           * Not `scrollWidth` either, for a reason that only shows up once the
           * track overflows: Chrome counts the track's *leading* padding in
           * `scrollWidth` and drops the trailing padding, which measured 2148
           * where the real width is 2172 (5 × 380 + 4 × 56 + 24 + 24). Being
           * 24px short would leave the fifth card 24px away from its gutter at
           * the end of the pin — a gap that reads as a card that failed to
           * arrive. `getBoundingClientRect` is not an option either: this
           * component writes a `translateX` onto the track, and the measurement
           * runs again on every refresh while that transform may be live.
           *
           * `offsetWidth` carries neither transforms nor margins, so summing the
           * cards and adding the gutters back is exact at any scroll position,
           * and it stays correct if the card width, gap or padding changes.
           */
          const measure = (): StageGeometry => {
            const style = getComputedStyle(track)
            const pad = parseFloat(style.paddingLeft) || 0
            const padRight = parseFloat(style.paddingRight) || 0
            const gap = parseFloat(style.columnGap) || 0
            const cards = Array.from(track.children) as HTMLElement[]
            const content = cards.reduce((sum, card) => sum + card.offsetWidth, 0)
            return {
              trackWidth: pad + content + gap * Math.max(0, cards.length - 1) + padRight,
              windowWidth: frameWindow.clientWidth,
              cardCount: cards.length,
              gap,
              pad,
            }
          }

          let geometry = measure()

          /** Writes one scroll progress to the three things that follow it. */
          const write = (progress: number) => {
            const frame = stageFrame(geometry, progress)
            track.style.transform = `translate3d(${frame.x}px, 0, 0)`
            if (fillRef.current) fillRef.current.style.width = `${frame.fillPercent}%`
            if (counterRef.current) {
              counterRef.current.textContent = `${pad2(frame.activeIndex + 1)} / ${pad2(total)}`
            }
            const cards = track.children
            for (let i = 0; i < cards.length; i += 1) {
              const card = cards[i] as HTMLElement
              if (i === frame.activeIndex) card.dataset.active = 'true'
              else delete card.dataset.active
            }
          }

          /**
           * A one-property proxy for the scrubbed playhead.
           *
           * `scrub` is not a property of a ScrollTrigger on its own: it smooths
           * the *animation* attached to the trigger, so the trigger needs one to
           * lag behind the scrollbar. Driving the proxy and writing from its
           * `onUpdate` — rather than from the trigger's — is what keeps the
           * counter and the progress bar in lockstep with the cards. Reading
           * `self.progress` on the trigger instead would move both of them up to
           * `scrub` seconds ahead of the track they describe.
           */
          const proxy = { p: 0 }
          const tween = gsap.to(proxy, {
            p: 1,
            ease: 'none',
            duration: 1,
            paused: true,
            onUpdate: () => write(proxy.p),
          })

          const trigger = ScrollTrigger.create({
            trigger: pin,
            start: `top ${STAGE_TOP_PX}px`,
            // Re-resolved on every refresh: the span depends on how much the
            // track overflows, which changes with the viewport.
            end: () => `+=${stageSpan(geometry, window.innerHeight)}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            animation: tween,
            onRefresh: () => {
              // The window and the track are re-measured on every refresh, so a
              // resize during the pin cannot leave `travel` stale.
              geometry = measure()
              write(proxy.p)
            },
          })

          return () => {
            trigger.kill()
            tween.kill()
          }
        },
      )
    }, pin)

    return () => ctx.revert()
    // Only the station count changes the geometry. The copy comes from i18n and
    // is re-read on render without rebuilding the pin — rebuilding it on a
    // language switch would scroll the page by the length of the old pin.
  }, [total])

  return (
    <div className="stage-pin" ref={pinRef}>
      <div className="stage-window" ref={windowRef}>
        <ol className="station-track" ref={trackRef}>
          {stations.map((station, i) => (
            <li
              key={station.step}
              className="station"
              /* The trigger owns this attribute from the first scroll on; the
                 first card is marked here so the still state (reduced motion, a
                 screenshot before any scroll) reads correctly. */
              data-active={i === 0 ? 'true' : undefined}
            >
              <span
                className="station__glow"
                style={{ background: `radial-gradient(circle, ${station.accent}33, transparent 70%)` }}
                aria-hidden="true"
              />
              <div className="station__head">
                <span className="station__step mono">{station.step}</span>
                <span
                  className="station__ai-tag"
                  style={{ color: station.accent, borderColor: `${station.accent}55` }}
                >
                  {t(`pipeline.${station.key}.ai` as const)}
                </span>
              </div>
              <h3 className="station__title">{t(`pipeline.${station.key}.title` as const)}</h3>
              <p className="station__body">{t(`pipeline.${station.key}.body` as const)}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* The counter is the only readout, so it is a live region: a screen
          reader hears "02 / 05" when the stage moves on. The progress bar is
          pure decoration and is hidden from assistive tech, which also keeps it
          out of the way of the counter's announcement. */}
      <div className="stage-counter mono" ref={counterRef} aria-live="polite">
        {`01 / ${pad2(total)}`}
      </div>
      <div className="stage-progress" aria-hidden="true">
        <div className="stage-progress__fill" ref={fillRef} />
      </div>
    </div>
  )
}
