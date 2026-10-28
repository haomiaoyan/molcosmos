import { describe, expect, it } from 'vitest'
import {
  HERO_BOX,
  HERO_MOLECULE_IDS,
  HERO_MODELS,
  buildHeroModel,
} from './heroMolecules'
import { findMoleculeById } from './galaxy'

describe('hero molecule geometry', () => {
  it('builds every declared molecule', () => {
    expect(HERO_MODELS).toHaveLength(HERO_MOLECULE_IDS.length)
    expect(HERO_MODELS.map((m) => m.id)).toEqual([...HERO_MOLECULE_IDS])
  })

  it('returns null for an unknown id', () => {
    expect(buildHeroModel('MCX-999999')).toBeNull()
  })

  it('keeps the molecule inside the animation box', () => {
    for (const model of HERO_MODELS) {
      const limit = HERO_BOX * 0.46
      for (const atom of model.atoms) {
        expect(Math.hypot(atom.x, atom.y, atom.z)).toBeLessThanOrEqual(limit + 0.01)
      }
      expect(model.radius).toBeCloseTo(limit, 1)
    }
  })

  it('centres the structure on the origin', () => {
    for (const model of HERO_MODELS) {
      const n = model.atoms.length
      const cx = model.atoms.reduce((s, a) => s + a.x, 0) / n
      const cy = model.atoms.reduce((s, a) => s + a.y, 0) / n
      const cz = model.atoms.reduce((s, a) => s + a.z, 0) / n
      expect(Math.abs(cx)).toBeLessThan(1)
      expect(Math.abs(cy)).toBeLessThan(1)
      expect(Math.abs(cz)).toBeLessThan(1)
    }
  })

  it('emits bonds that reference real atom indices', () => {
    for (const model of HERO_MODELS) {
      expect(model.bonds.length).toBeGreaterThan(0)
      for (const bond of model.bonds) {
        expect(bond.from).toBeGreaterThanOrEqual(0)
        expect(bond.from).toBeLessThan(model.atoms.length)
        expect(bond.to).toBeGreaterThanOrEqual(0)
        expect(bond.to).toBeLessThan(model.atoms.length)
        expect(bond.from).not.toBe(bond.to)
        expect(bond.length).toBeGreaterThan(0)
      }
    }
  })

  it('places each bond midpoint between its two atoms', () => {
    for (const model of HERO_MODELS) {
      for (const bond of model.bonds) {
        const a = model.atoms[bond.from]
        const b = model.atoms[bond.to]
        expect(bond.x).toBeCloseTo((a.x + b.x) / 2, 1)
        expect(bond.y).toBeCloseTo((a.y + b.y) / 2, 1)
        expect(bond.z).toBeCloseTo((a.z + b.z) / 2, 1)
      }
    }
  })

  it('aims every bond along its own direction vector', () => {
    // Rz(theta)·Ry(phi)·x̂ must equal the normalised bond direction.
    for (const model of HERO_MODELS) {
      for (const bond of model.bonds) {
        const a = model.atoms[bond.from]
        const b = model.atoms[bond.to]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dz = b.z - a.z
        const len = Math.hypot(dx, dy, dz)
        const theta = (bond.theta * Math.PI) / 180
        const phi = (bond.phi * Math.PI) / 180
        expect(Math.cos(theta) * Math.cos(phi)).toBeCloseTo(dx / len, 2)
        expect(Math.sin(theta) * Math.cos(phi)).toBeCloseTo(dy / len, 2)
        expect(-Math.sin(phi)).toBeCloseTo(dz / len, 2)
      }
    }
  })

  it('derives atom counts and formula from the catalogue entry', () => {
    for (const model of HERO_MODELS) {
      const molecule = findMoleculeById(model.id)
      expect(molecule).not.toBeNull()
      const counts = molecule!.props.counts
      expect(model.atoms).toHaveLength(counts.C + counts.N + counts.O + counts.S)
      expect(model.formula).toMatch(/^C\d+/)
      expect(model.formula).toContain('H')
    }
  })

  it('scales with the requested box size', () => {
    const small = buildHeroModel(HERO_MOLECULE_IDS[0], 120)
    const large = buildHeroModel(HERO_MOLECULE_IDS[0], 480)
    expect(small).not.toBeNull()
    expect(large).not.toBeNull()
    expect(large!.radius).toBeCloseTo(small!.radius * 4, 1)
    expect(large!.atoms[0].size).toBeCloseTo(small!.atoms[0].size * 4, 1)
  })

  it('picks molecules with distinct element palettes', () => {
    const palettes = HERO_MODELS.map((m) =>
      [...new Set(m.atoms.map((a) => a.element))].sort().join(''),
    )
    expect(palettes.some((p) => p.includes('S'))).toBe(true)
    expect(new Set(palettes).size).toBeGreaterThan(1)
  })
})
