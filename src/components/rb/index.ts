/**
 * Typed boundary for the vendored React Bits components.
 *
 * The upstream files are plain JSX (ts-nocheck). Everything the app imports
 * comes through here, so call sites still get checked props and IntelliSense.
 */
import type { CSSProperties, ReactNode } from 'react'
import StarBorderImpl from './StarBorder/StarBorder'
import SpotlightCardImpl from './SpotlightCard/SpotlightCard'
import ClickSparkImpl from './ClickSpark/ClickSpark'
import MagnetImpl from './Magnet/Magnet'
import FadeContentImpl from './FadeContent/FadeContent'

type WithCommon = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export interface StarBorderProps extends WithCommon {
  as?: 'button' | 'a' | 'span' | 'div'
  color?: string
  trailColor?: string
  duration?: number
  thickness?: number
  radius?: number
  trailLength?: number
  stars?: number
  glow?: number
  sparkle?: boolean
  direction?: 'clockwise' | 'counterclockwise'
  hover?: 'lap' | 'brighten' | 'reveal' | 'none'
  clickPulse?: boolean
  theme?: 'dark' | 'light'
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface SpotlightCardProps extends WithCommon {
  spotlightColor?: string
  intensity?: number
  spotlightSize?: number
  softness?: number
  shape?: string
  borderGlow?: number
  proximity?: number
  smoothing?: number
  ambient?: boolean
  flare?: boolean
  grain?: number
  theme?: 'dark' | 'light'
}

export interface ClickSparkProps extends WithCommon {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  sparkWidth?: number
  duration?: number
  easing?: string
  extraScale?: number
  shape?: string
  randomness?: number
  gravity?: number
  spread?: number
  direction?: number
  glow?: number
  ring?: boolean
  layer?: 'front' | 'back'
  disabled?: boolean
}

export interface MagnetProps extends WithCommon {
  padding?: number
  disabled?: boolean
  magnetStrength?: number
  maxOffset?: number
  exclusive?: boolean
  axis?: 'both' | 'x' | 'y'
  tilt?: number
  scale?: number
  wrapperClassName?: string
  innerClassName?: string
}

export interface FadeContentProps extends WithCommon {
  as?: 'div' | 'h1' | 'h2' | 'p' | 'span' | 'section' | 'header' | 'ol' | 'ul'
  effect?: string
  blur?: boolean
  duration?: number
  ease?: string
  delay?: number
  threshold?: number
  initialOpacity?: number
  stagger?: number
  staggerFrom?: string
  trigger?: 'scroll' | 'mount'
  once?: boolean
  exit?: boolean
  scrub?: boolean
}

type Component<P> = (props: P) => ReactNode

export const StarBorder = StarBorderImpl as Component<StarBorderProps>
export const SpotlightCard = SpotlightCardImpl as Component<SpotlightCardProps>
export const ClickSpark = ClickSparkImpl as Component<ClickSparkProps>
export const Magnet = MagnetImpl as Component<MagnetProps>
export const FadeContent = FadeContentImpl as Component<FadeContentProps>
