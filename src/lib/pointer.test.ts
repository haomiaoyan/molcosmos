import { describe, expect, it } from 'vitest'
import { pointerField, pointerVars } from './pointer'

/**
 * The hook itself needs a DOM (listeners, rAF, `getBoundingClientRect`), and
 * this project deliberately has no jsdom. Everything that can be wrong without
 * a browser — which box drives which axis, when the light is allowed to show,
 * and the old numbers a caller without a surface must still get — lives in
 * `pointerField`, so it can be pinned here.
 *
 * The geometry is the one measured in `docs/plan-glow-fix.md`: `.hero` sits
 * inside the 1180px `.app` (130..1310), while `.hero__stage` is full-bleed
 * (0..1440). That 130px difference is what made the light fly off at the
 * screen edges, so it is the case the tests use.
 */

/** `.hero` at 1440x900: the app column, 130px in from each side. */
const HERO = { left: 130, top: 80, width: 1180, height: 900 }
/** `.hero__stage` at 1440x900: the full-bleed layer, aligned to viewport x=0. */
const STAGE = { left: 0, top: 80, width: 1440, height: 900 }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * The pre-fix arithmetic, transcribed from the old `onMove` handler:
 * viewport X for the light, hero-local Y, and no hit test at all — the
 * element listener could only fire for a pointer that was already on the hero.
 */
function legacy(clientX: number, clientY: number, rect = HERO, viewportWidth = 1440) {
  return {
    x: clamp((clientX - rect.left) / rect.width, 0, 1),
    y: clamp((clientY - rect.top) / rect.height, 0, 1),
    vx: clamp(clientX, 0, viewportWidth),
    vy: clamp(clientY - rect.top, 0, rect.height),
  }
}

describe('pointerField — the --m-on decision', () => {
  // Q1 (follow to the screen edges) and Q3 (collapse once the hero is scrolled
  // past) are two independent conditions that must both hold.
  const cases = [
    { inside: true, visible: true, expected: true, why: 'pointer over the hero, hero on screen' },
    { inside: true, visible: false, expected: false, why: 'pointer over the hero, scrolled away' },
    { inside: false, visible: true, expected: false, why: 'pointer outside the stage, hero on screen' },
    { inside: false, visible: false, expected: false, why: 'neither condition holds' },
  ]

  for (const c of cases) {
    it(`${c.expected ? 'on' : 'off'} when the ${c.why}`, () => {
      const field = pointerField({
        // x=720 is the middle of both boxes, so only the hit test varies here.
        clientX: c.inside ? 720 : -40,
        clientY: 400,
        hero: HERO,
        surface: STAGE,
        heroVisible: c.visible,
      })
      expect(field.inside).toBe(c.expected)
    })
  }

  it('turns off while scrolled away even though the pointer is still inside the stage', () => {
    // The whole point of Q3: the stage is as tall as the hero, so on a long
    // page a stationary pointer can be inside the stage's old box while the
    // hero itself is thousands of pixels above the viewport. Trusting the
    // box alone would leave the light burning in the middle of section 4.
    const overStage = { clientX: 720, clientY: 400, hero: HERO, surface: STAGE }
    expect(pointerField({ ...overStage, heroVisible: true }).inside).toBe(true)
    expect(pointerField({ ...overStage, heroVisible: false }).inside).toBe(false)
  })

  it('is off above and below the stage, not just beside it', () => {
    const above = pointerField({ clientX: 720, clientY: 10, hero: HERO, surface: STAGE, heroVisible: true })
    const below = pointerField({ clientX: 720, clientY: 2000, hero: HERO, surface: STAGE, heroVisible: true })
    expect(above.inside).toBe(false)
    expect(below.inside).toBe(false)
  })

  it('accepts the screen edges as inside, which is the bug being fixed', () => {
    // clientX 20 and 1420 are outside `.hero` (130..1310) but inside the stage.
    // Before the fix these read --m-on: 0 and the light vanished.
    for (const x of [20, 720, 1420]) {
      expect(pointerField({ clientX: x, clientY: 400, hero: HERO, surface: STAGE, heroVisible: true }).inside).toBe(true)
    }
  })
})

describe('pointerField — two-coordinate sourcing', () => {
  it('takes --px/--py from the stage and --mx/--my from the hero', () => {
    // Pointer 60px from the left edge: 60px into the stage, but 70px to the
    // LEFT of the hero, so the normalised value pins at 0 while the pixel
    // value stays positive. If both came from one box these could not differ.
    const field = pointerField({ clientX: 60, clientY: 400, hero: HERO, surface: STAGE, heroVisible: true })

    expect(field.vx).toBe(60) // 60 - stage.left (0)
    expect(field.x).toBe(0) // (60 - hero.left 130) / 1180 = -0.059, clamped
    expect(field.vy).toBe(320) // 400 - stage.top (80)
    expect(field.y).toBeCloseTo(0.3556, 3) // (400 - hero.top 80) / 900
  })

  it('keeps the stage offset inside the hero as well', () => {
    const field = pointerField({ clientX: 700, clientY: 400, hero: HERO, surface: STAGE, heroVisible: true })

    expect(field.vx).toBe(700)
    // 130px less than the pixellated one would put the highlight 130px left.
    expect(field.x).toBeCloseTo((700 - 130) / 1180, 4)
    expect(field.vy).toBe(320)
  })

  it('reads the vertical origin from the surface, not from the hero', () => {
    // A surface that starts above the hero (a taller backdrop) must still be
    // the frame of reference for --py: the light is positioned in that box.
    const tallStage = { left: 0, top: 0, width: 1440, height: 1000 }
    const field = pointerField({ clientX: 700, clientY: 500, hero: HERO, surface: tallStage, heroVisible: true })

    expect(field.vy).toBe(500) // 500 - 0
    expect(field.y).toBeCloseTo((500 - 80) / 900, 4) // still hero-relative
  })

  it('clamps the stage coordinates to the stage box', () => {
    // The pointer can leave the stage (below the hero, or outside the window
    // while a drag is in flight); pin it to the edge instead of letting the
    // light fly off by thousands of pixels.
    const far = pointerField({ clientX: 5000, clientY: 5000, hero: HERO, surface: STAGE, heroVisible: true })
    expect(far.vx).toBe(1440)
    expect(far.vy).toBe(900)
  })
})

describe('pointerField — without a surface (old single-ref behaviour)', () => {
  it('reproduces the old numbers exactly', () => {
    // A caller that still passes one ref only: the light used to be positioned
    // against the viewport strip that starts at x=0 and at the hero's top.
    for (const [clientX, clientY] of [[720, 400], [200, 400], [100, 400], [1420, 400], [1250, 860], [0, 0]]) {
      const field = pointerField({ clientX, clientY, hero: HERO, heroVisible: true, viewportWidth: 1440 })
      const old = legacy(clientX, clientY)
      expect(field.x, `x at ${clientX},${clientY}`).toBeCloseTo(old.x, 10)
      expect(field.y, `y at ${clientX},${clientY}`).toBeCloseTo(old.y, 10)
      expect(field.vx, `vx at ${clientX},${clientY}`).toBe(old.vx)
      expect(field.vy, `vy at ${clientX},${clientY}`).toBe(old.vy)
    }
  })

  it('reports inside from the hero box, which is where the old listener fired', () => {
    // The old hook attached to `.hero`, so a move anywhere else could never
    // reach it. The pure transcription of "would that listener have fired" is
    // the hero hit test.
    const inHero = pointerField({ clientX: 720, clientY: 400, hero: HERO, heroVisible: true })
    const atEdge = pointerField({ clientX: 60, clientY: 400, hero: HERO, heroVisible: true })

    expect(inHero.inside).toBe(true)
    expect(atEdge.inside).toBe(false)
  })

  it('still honours the hero-visibility condition', () => {
    const off = pointerField({ clientX: 720, clientY: 400, hero: HERO, heroVisible: false })
    expect(off.inside).toBe(false)
  })

  it('defaults to visible when the caller does not say', () => {
    expect(pointerField({ clientX: 720, clientY: 400, hero: HERO }).inside).toBe(true)
  })
})

describe('pointerField — degenerate boxes', () => {
  it('falls back to rest instead of dividing by zero', () => {
    const flat = { left: 130, top: 80, width: 0, height: 900 }
    expect(pointerField({ clientX: 400, clientY: 400, hero: flat, surface: STAGE, heroVisible: true })).toEqual({
      x: 0.5,
      y: 0.5,
      vx: 0,
      vy: 0,
      inside: false,
    })
  })

  it('falls back to rest when the surface has collapsed', () => {
    const flatStage = { left: 0, top: 80, width: 1440, height: 0 }
    expect(pointerField({ clientX: 400, clientY: 400, hero: HERO, surface: flatStage, heroVisible: true }).inside).toBe(false)
  })
})

describe('pointerVars', () => {
  it('publishes the stage coordinates in px and the normalised ones raw', () => {
    const vars = pointerVars({ x: 0.25, y: 0.5, vx: 360.4, vy: 480.6, inside: true })

    expect(vars['--px']).toBe('360px')
    expect(vars['--py']).toBe('481px')
    expect(vars['--mx']).toBe('0.25')
    expect(vars['--my']).toBe('0.5')
    expect(vars['--m-on']).toBe('1')
  })

  it('switches the layer off when the pointer is not counted', () => {
    expect(pointerVars({ x: 0.5, y: 0.5, vx: 0, vy: 0, inside: false })['--m-on']).toBe('0')
  })
})
