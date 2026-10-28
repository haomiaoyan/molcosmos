import { useEffect, useRef, useState } from 'react'
import { HERO_MODELS, type HeroAtom, type HeroBond, type HeroModel } from '../lib/heroMolecules'
import { ELEMENT_COLORS } from '../lib/molecule'

/**
 * Decorative ball-and-stick molecule beside the hero title.
 *
 * Drawn on a 2D canvas — deliberately *not* WebGL, because the page already
 * holds two WebGL contexts (the galaxy and the detail panel) and a third one
 * risks eviction on low-end devices.
 */

/** One full 360° turn. */
const SPIN_MS = 9000
/** Freeze between turns so the structure can actually be read. */
const HOLD_MS = 2000
/** Cross-fade into the next molecule. */
const FADE_MS = 400
const CYCLE_MS = SPIN_MS + HOLD_MS + FADE_MS
/** Hovering speeds the turn up to this duration. */
const HOVER_SPEED = 1.35

/** Camera distance in model units; smaller means stronger perspective. */
const CAMERA = 560
/** Fixed forward tilt, in radians, so the structure reads as 3D even at rest. */
const TILT = (-12 * Math.PI) / 180

interface Projected {
  atom: HeroAtom
  x: number
  y: number
  z: number
  /** Perspective scale factor at this depth. */
  p: number
}

export function HeroMolecule() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const hoverRef = useRef(false)
  const [formula, setFormula] = useState(() => HERO_MODELS[0]?.formula ?? '')

  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host || HERO_MODELS.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0

    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    resize()

    const observer = new ResizeObserver(() => {
      resize()
      if (reduced) paint(0)
    })
    observer.observe(host)

    // --- timing state (declared before `paint`, which reads `index`) -----
    let index = 0
    let local = 0
    let angle = 0
    let last = performance.now()

    // --- renderer -------------------------------------------------------
    const paint = (angleDeg: number, model: HeroModel = HERO_MODELS[index], alpha = 1) => {
      if (width === 0 || height === 0) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (alpha >= 1) ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const fit = Math.min(width, height) / 240
      const a = (angleDeg * Math.PI) / 180
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const ct = Math.cos(TILT)
      const st = Math.sin(TILT)

      const projected: Projected[] = model.atoms.map((atom) => {
        const x1 = atom.x * ca + atom.z * sa
        const z1 = -atom.x * sa + atom.z * ca
        const y2 = atom.y * ct - z1 * st
        const z2 = atom.y * st + z1 * ct
        const p = CAMERA / (CAMERA - z2)
        return {
          atom,
          x: cx + x1 * p * fit,
          y: cy + y2 * p * fit,
          z: z2,
          p: p * fit,
        }
      })

      const depthAlpha = (z: number) => 0.5 + 0.5 * ((z + model.radius) / (model.radius * 2 || 1))

      // Bonds first, back to front, so the balls always sit on top.
      const bonds = model.bonds
        .map((bond) => {
          const a0 = projected[bond.from]
          const a1 = projected[bond.to]
          return { bond, a0, a1, z: (a0.z + a1.z) / 2 }
        })
        .sort((l, r) => l.z - r.z)

      for (const { bond, a0, a1, z } of bonds) {
        drawBond(ctx, bond, a0, a1, depthAlpha(z) * alpha)
      }

      const atoms = [...projected].sort((l, r) => l.z - r.z)
      for (const atom of atoms) {
        drawAtom(ctx, atom, depthAlpha(atom.z) * alpha)
      }
    }

    // --- loop -----------------------------------------------------------
    const frame = (now: number) => {
      const dt = Math.min(now - last, 64)
      last = now

      local += dt
      const spinning = local < SPIN_MS
      if (spinning) angle += (360 / SPIN_MS) * dt * (hoverRef.current ? HOVER_SPEED : 1)

      if (local >= CYCLE_MS) {
        local -= CYCLE_MS
        angle = 0
        index = (index + 1) % HERO_MODELS.length
        setFormula(HERO_MODELS[index].formula)
      }

      const fadeStart = SPIN_MS + HOLD_MS
      if (local >= fadeStart) {
        const f = Math.min(1, (local - fadeStart) / FADE_MS)
        const next = (index + 1) % HERO_MODELS.length
        paint(angle, HERO_MODELS[index], 1)
        paint(0, HERO_MODELS[next], f)
      } else {
        paint(spinning ? angle : 360, HERO_MODELS[index], 1)
      }

      raf = requestAnimationFrame(frame)
    }

    let raf = 0
    if (reduced) {
      paint(38, HERO_MODELS[0], 1)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onEnter = () => {
      hoverRef.current = true
    }
    const onLeave = () => {
      hoverRef.current = false
    }
    host.addEventListener('pointerenter', onEnter)
    host.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      host.removeEventListener('pointerenter', onEnter)
      host.removeEventListener('pointerleave', onLeave)
    }
    // `paint` closes over module-level geometry only, so mount-once is correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="hero__molecule" ref={hostRef} aria-hidden="true">
      <canvas ref={canvasRef} className="hero__molecule-canvas" />
      <span className="hero__molecule-label">{formula}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// drawing helpers
// ---------------------------------------------------------------------------

function drawBond(
  ctx: CanvasRenderingContext2D,
  bond: HeroBond,
  from: Projected,
  to: Projected,
  alpha: number,
): void {
  if (alpha <= 0.01) return
  const width = Math.max(0.8, bond.thickness * ((from.p + to.p) / 2))
  const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y)
  grad.addColorStop(0, withAlpha(ELEMENT_COLORS[from.atom.element], 0.85))
  grad.addColorStop(1, withAlpha(ELEMENT_COLORS[to.atom.element], 0.85))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = grad
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.restore()
}

function drawAtom(ctx: CanvasRenderingContext2D, atom: Projected, alpha: number): void {
  if (alpha <= 0.01) return
  const r = Math.max(1.5, (atom.atom.size / 2) * atom.p)
  const base = ELEMENT_COLORS[atom.atom.element]

  ctx.save()
  ctx.globalAlpha = alpha

  // Soft halo so atoms read against the dark backdrop.
  const halo = ctx.createRadialGradient(atom.x, atom.y, r * 0.6, atom.x, atom.y, r * 2.1)
  halo.addColorStop(0, withAlpha(base, 0.3))
  halo.addColorStop(1, withAlpha(base, 0))
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(atom.x, atom.y, r * 2.1, 0, Math.PI * 2)
  ctx.fill()

  // Lit ball: highlight up-left, shadow down-right.
  const ball = ctx.createRadialGradient(
    atom.x - r * 0.34,
    atom.y - r * 0.38,
    r * 0.12,
    atom.x,
    atom.y,
    r,
  )
  ball.addColorStop(0, mix(base, '#ffffff', 0.62))
  ball.addColorStop(0.55, base)
  ball.addColorStop(1, mix(base, '#000000', 0.42))
  ctx.fillStyle = ball
  ctx.beginPath()
  ctx.arc(atom.x, atom.y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * amount)
  return `rgb(${lerp(r1, r2)}, ${lerp(g1, g2)}, ${lerp(b1, b2)})`
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}
