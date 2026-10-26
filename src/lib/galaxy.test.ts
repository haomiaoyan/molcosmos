import { describe, expect, it } from 'vitest'
import {
  ARMS,
  GALAXY_RADIUS,
  UNIVERSE_SIZE,
  findMoleculeById,
  nearestMolecule,
  spawnExplorationBatch,
  universe,
  universeStats,
} from './galaxy'
import { classify } from './molecule'

describe('universe', () => {
  it('builds exactly UNIVERSE_SIZE molecules deterministically', () => {
    const a = universe()
    const b = universe()
    expect(a.length).toBe(UNIVERSE_SIZE)
    expect(a).toBe(b) // cached
    expect(a[0]).toEqual(universe()[0])
  })

  it('gives every molecule a unique id and a valid class', () => {
    const ids = new Set(universe().map((m) => m.id))
    expect(ids.size).toBe(UNIVERSE_SIZE)
    for (const m of universe()) {
      expect(m.drugClass).toBe(classify(m.score))
      expect(m.score).toBeGreaterThanOrEqual(0)
      expect(m.score).toBeLessThanOrEqual(1)
    }
  })

  it('spreads molecules across the spiral within the galaxy radius', () => {
    for (const m of universe()) {
      const r = Math.hypot(m.x, m.z)
      expect(r).toBeLessThanOrEqual(GALAXY_RADIUS + 4)
    }
    // Multiple arms are actually used.
    const angles = universe().map((m) => Math.atan2(m.z, m.x))
    expect(angles.filter((a) => a > -0.5 && a < 0.5).length).toBeGreaterThan(10)
    expect(ARMS).toBeGreaterThanOrEqual(2)
  })

  it('produces all four classes over 600 samples', () => {
    const stats = universeStats()
    expect(stats.total).toBe(UNIVERSE_SIZE)
    expect(stats.byClass.goldilocks).toBeGreaterThan(0)
    expect(stats.byClass.candidate).toBeGreaterThan(0)
    expect(stats.byClass.lead).toBeGreaterThan(0)
    expect(stats.byClass.far).toBeGreaterThan(0)
    expect(stats.meanScore).toBeGreaterThan(0)
    expect(stats.byClass.goldilocks + stats.byClass.candidate + stats.byClass.lead + stats.byClass.far).toBe(UNIVERSE_SIZE)
  })
})

describe('lookup helpers', () => {
  it('finds molecules by id', () => {
    const m = universe()[10]
    expect(findMoleculeById(m.id)?.id).toBe(m.id)
    expect(findMoleculeById('MCX-999999')).toBeNull()
  })

  it('returns the spatially nearest molecule', () => {
    const all = universe()
    const target = all[42]
    expect(nearestMolecule(all, target.x, target.y, target.z)?.id).toBe(target.id)
    expect(nearestMolecule(all, 0, 0, 0)).not.toBeNull()
  })
})

describe('exploration stars', () => {
  it('spawns deterministic batches that differ per round', () => {
    const a = spawnExplorationBatch(0)
    const b = spawnExplorationBatch(0)
    const c = spawnExplorationBatch(1)
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
    expect(a.length).toBeGreaterThan(0)
    for (const s of a) {
      expect(s.score).toBeGreaterThanOrEqual(0.82)
      expect(s.score).toBeLessThanOrEqual(1)
    }
  })

  it('clusters exploration stars inside the galaxy bounds', () => {
    for (const s of spawnExplorationBatch(3)) {
      expect(Math.hypot(s.x, s.z)).toBeLessThanOrEqual(GALAXY_RADIUS + 4)
    }
  })
})
