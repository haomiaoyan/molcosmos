interface Props {
  /** Dot texture: the light themes read better with it than with stars. */
  dotted?: boolean
}

/**
 * Full-bleed backdrop for the hero.
 *
 * Purely decorative: it carries no content, is invisible to assistive tech and
 * never takes pointer events. Its width is `calc(100vw - var(--sbw))` rather
 * than `100vw` so it lines up with the visible viewport instead of the
 * scrollbar-inclusive one (see `lib/scrollbar.ts`).
 */
export function HeroStage({ dotted = true }: Props) {
  return (
    <div className={`hero__stage${dotted ? ' hero__stage--dotted' : ''}`} aria-hidden="true">
      <div className="hero__stage-glow" />
      <div className="hero__stage-dots" />
      <div className="hero__stage-stars" />
    </div>
  )
}
