import { describe, expect, it } from 'vitest'
import {
  clamp,
  classify,
  druglikenessScore,
  estimateHydrogens,
  estimateLogP,
  generateMoleculeProps,
  heavyAtomCount,
  layoutStructure,
  lipinskiViolations,
  molecularFormula,
  molecularWeight,
  moleculeId,
  round2,
  seedForIndex,
} from './molecule'
import { hashString, makeRng } from './rng'

describe('rng', () => {
  it('reproduces the same sequence for the same seed', () => {
    const a = makeRng(20261026)
    const b = makeRng(20261026)
    const seqA = Array.from({ length: 8 }, () => a())
    const seqB = Array.from({ length: 8 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('differs between seeds and stays in [0, 1)', () => {
    const a = makeRng(1)
    const b = makeRng(2)
    const seqA = Array.from({ length: 8 }, () => a())
    const seqB = Array.from({ length: 8 }, () => b())
    expect(seqA).not.toEqual(seqB)
    for (const v of [...seqA, ...seqB]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('hashes strings stably and differently', () => {
    expect(hashString('MCX-000001')).toBe(hashString('MCX-000001'))
    expect(hashString('MCX-000001')).not.toBe(hashString('MCX-000002'))
  })

  it('recovers from a zero seed', () => {
    const rng = makeRng(0)
    expect(rng()).toBeGreaterThanOrEqual(0)
  })
})

describe('molecule props', () => {
  it('is deterministic for a given index', () => {
    expect(generateMoleculeProps(seedForIndex(42))).toEqual(generateMoleculeProps(seedForIndex(42)))
    expect(generateMoleculeProps(seedForIndex(42))).not.toEqual(
      generateMoleculeProps(seedForIndex(43)),
    )
  })

  it('keeps heavy-atom counts within the documented ranges', () => {
    for (let index = 0; index < 200; index++) {
      const props = generateMoleculeProps(seedForIndex(index))
      expect(props.counts.C).toBeGreaterThanOrEqual(6)
      expect(props.counts.C).toBeLessThanOrEqual(29)
      expect(props.counts.N).toBeLessThanOrEqual(4)
      expect(props.counts.O).toBeLessThanOrEqual(6)
      expect(props.counts.S).toBeLessThanOrEqual(1)
      expect(props.rings).toBeGreaterThanOrEqual(1)
      expect(props.rings).toBeLessThanOrEqual(4)
    }
  })

  it('computes molecular weight from atom counts only', () => {
    expect(molecularWeight({ C: 1, N: 0, O: 0, S: 0 })).toBeCloseTo(12.011, 3)
    expect(molecularWeight({ C: 0, N: 0, O: 2, S: 0 })).toBeCloseTo(31.998, 3)
  })

  it('computes heavy atom counts and hydrogens non-negative', () => {
    expect(heavyAtomCount({ C: 10, N: 2, O: 3, S: 1 })).toBe(16)
    expect(estimateHydrogens({ C: 0, N: 0, O: 0, S: 0 }, 0)).toBeGreaterThanOrEqual(0)
    expect(estimateHydrogens({ C: 30, N: 4, O: 6, S: 1 }, 4)).toBeGreaterThanOrEqual(0)
  })

  it('bounds logP within the documented window', () => {
    for (let index = 0; index < 100; index++) {
      const rng = makeRng(seedForIndex(index))
      const logP = estimateLogP(generateMoleculeProps(seedForIndex(index)).counts, rng)
      expect(logP).toBeGreaterThanOrEqual(-1.5)
      expect(logP).toBeLessThanOrEqual(9)
    }
  })
})

describe('scoring', () => {
  it('scores the ideal molecule near 1', () => {
    const ideal = { counts: { C: 20, N: 2, O: 3, S: 0 }, rings: 3, mw: 350, logP: 2.5, hbd: 2, hba: 5 }
    expect(druglikenessScore(ideal)).toBeGreaterThan(0.95)
  })

  it('scores far molecules low', () => {
    const far = { counts: { C: 28, N: 0, O: 0, S: 1 }, rings: 4, mw: 600, logP: 9, hbd: 0, hba: 0 }
    // logP=9 kills the logP term, but the remaining flat terms still carry weight;
    // the teaching score is closeness, not activity — far simply means "below candidate".
    expect(druglikenessScore(far)).toBeLessThan(0.35)
    expect(classify(druglikenessScore(far))).toBe('far')
  })

  it('classifies monotonically', () => {
    expect(classify(0.9)).toBe('goldilocks')
    expect(classify(0.7)).toBe('candidate')
    expect(classify(0.4)).toBe('lead')
    expect(classify(0.1)).toBe('far')
  })

  it('flags Lipinski violations with labels', () => {
    expect(lipinskiViolations({ counts: { C: 1, N: 0, O: 0, S: 0 }, rings: 0, mw: 600, logP: 7, hbd: 6, hba: 12 })).toEqual([
      'MW > 500',
      'logP > 5',
      'HBD > 5',
      'HBA > 10',
    ])
    expect(lipinskiViolations({ counts: { C: 1, N: 0, O: 0, S: 0 }, rings: 0, mw: 400, logP: 3, hbd: 2, hba: 5 })).toEqual([])
  })
})

describe('structure layout', () => {
  it('builds a connected skeleton with consistent bonds', () => {
    const seed = seedForIndex(7)
    const molecule = makeMolecule(7, seed)
    const structure = layoutStructure(molecule)
    expect(structure.atoms.length).toBe(heavyAtomCount(molecule.props.counts))
    expect(structure.bonds.length).toBeGreaterThanOrEqual(structure.atoms.length - 1)
    // Every bond endpoint is a valid atom index.
    for (const [a, b] of structure.bonds) {
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(structure.atoms.length)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(structure.atoms.length)
      expect(a).not.toBe(b)
    }
  })

  it('relaxes bonded atoms to near bond length', () => {
    const molecule = makeMolecule(11, seedForIndex(11))
    const { atoms, bonds } = layoutStructure(molecule)
    for (const [a, b] of bonds) {
      const d = Math.hypot(
        atoms[a].x - atoms[b].x,
        atoms[a].y - atoms[b].y,
        atoms[a].z - atoms[b].z,
      )
      expect(d).toBeGreaterThan(1.1)
      expect(d).toBeLessThan(2.1)
    }
  })

  it('is centred near the origin', () => {
    const molecule = makeMolecule(3, seedForIndex(3))
    const { atoms } = layoutStructure(molecule)
    const cx = atoms.reduce((s, a) => s + a.x, 0) / atoms.length
    const cy = atoms.reduce((s, a) => s + a.y, 0) / atoms.length
    const cz = atoms.reduce((s, a) => s + a.z, 0) / atoms.length
    expect(Math.hypot(cx, cy, cz)).toBeLessThan(0.2)
  })

  it('is deterministic', () => {
    const m = makeMolecule(5, seedForIndex(5))
    expect(layoutStructure(m)).toEqual(layoutStructure(m))
  })
})

describe('formatting helpers', () => {
  it('formats formulas with Hill ordering', () => {
    expect(molecularFormula({ C: 3, N: 1, O: 2, S: 0 }, 7)).toBe('C3H7NO2')
    expect(molecularFormula({ C: 0, N: 0, O: 0, S: 0 }, 0)).toBe('')
    expect(molecularFormula({ C: 2, N: 0, O: 0, S: 1 }, 6)).toBe('C2H6S')
  })

  it('pads molecule ids and derives distinct seeds', () => {
    expect(moleculeId(0)).toBe('MCX-000000')
    expect(moleculeId(123456)).toBe('MCX-123456')
    expect(seedForIndex(1)).not.toBe(seedForIndex(2))
  })

  it('rounds helpers behave', () => {
    expect(round2(1.006)).toBe(1.01)
    expect(round2(1.004)).toBe(1)
    expect(clamp(5, 0, 3)).toBe(3)
    expect(clamp(-5, 0, 3)).toBe(0)
  })
})

function makeMolecule(index: number, seed: number) {
  const props = generateMoleculeProps(seed)
  return {
    id: moleculeId(index),
    index,
    seed,
    props,
    score: druglikenessScore(props),
    drugClass: classify(druglikenessScore(props)),
    lipinskiViolations: lipinskiViolations(props),
    x: 0,
    y: 0,
    z: 0,
  }
}
