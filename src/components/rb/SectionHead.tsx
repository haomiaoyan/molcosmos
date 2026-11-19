import type { ReactNode } from 'react'
import { FadeContent } from './index'

/**
 * Shared entrance for every `.section__head` in B2.
 *
 * FadeContent renders via `as` so the header keeps its semantics, and its
 * reduced-motion branch short-circuits before creating any ScrollTrigger.
 * The vendored component is fail-visible (never sets visibility:hidden), so
 * a broken trigger cannot blank a chapter heading.
 */
export function SectionHead({ children }: { children: ReactNode }) {
  return (
    <FadeContent as="header" className="section__head" trigger="scroll" duration={0.7} once>
      {children}
    </FadeContent>
  )
}
