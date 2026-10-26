import { describe, expect, it } from 'vitest'
import { nearestOnScreen, toNdc } from './pick'

const at = (x: number, y: number, z = 0) => ({ id: `${x},${y}`, x, y, z })

describe('nearestOnScreen', () => {
  it('returns the closest projected point', () => {
    const a = at(0, 0)
    const b = at(0.4, 0.4)
    const result = nearestOnScreen([a, b], (p) => p, 0.1, 0.1, 0.5)
    expect(result?.item).toBe(a)
    expect(result?.dist).toBeCloseTo(Math.hypot(0.1, 0.1), 6)
  })

  it('returns null when every candidate is outside the hit radius', () => {
    const a = at(0.9, 0.9)
    expect(nearestOnScreen([a], (p) => p, -0.8, -0.8, 0.05)).toBeNull()
  })

  it('ignores points behind the camera', () => {
    const behind = at(0, 0, 1.5)
    const visible = at(0.3, 0.3)
    const result = nearestOnScreen([behind, visible], (p) => p, 0, 0, 0.5)
    expect(result?.item).toBe(visible)
  })

  it('returns null for an empty universe', () => {
    expect(nearestOnScreen([], (p: ReturnType<typeof at>) => p, 0, 0, 0.1)).toBeNull()
  })
})

describe('toNdc', () => {
  it('maps the element centre to the origin', () => {
    const ndc = toNdc(150, 100, { left: 0, top: 0, width: 300, height: 200 })
    expect(ndc.x).toBeCloseTo(0, 10)
    expect(ndc.y).toBeCloseTo(0, 10)
  })

  it('maps the top-left corner to (-1, 1)', () => {
    const ndc = toNdc(0, 0, { left: 0, top: 0, width: 300, height: 200 })
    expect(ndc.x).toBeCloseTo(-1, 10)
    expect(ndc.y).toBeCloseTo(1, 10)
  })

  it('accounts for a non-zero element offset', () => {
    const ndc = toNdc(160, 120, { left: 100, top: 20, width: 200, height: 200 })
    expect(ndc.x).toBeCloseTo(-0.4, 10)
    expect(ndc.y).toBeCloseTo(0, 10)
  })
})
