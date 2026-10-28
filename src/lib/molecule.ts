/**
 * Core molecule model for MolCosmos.
 *
 * Conventions used everywhere in this file and in the UI:
 *  - Every molecule is SYNTHETIC: deterministic pseudo-random values derived
 *    from a fixed seed. No real compound, no real assay data is bundled.
 *  - Heavy-atom counts (C/N/O/S) drive everything: molecular weight,
 *    estimated logP, H-bond donors/acceptors and the drug-likeness score.
 *  - The score is a teaching composite ("类药潜力"), NOT a real activity
 *    prediction. It only measures distance to the Lipinski ideal zone.
 */

import { hashString, makeRng, type Rng } from './rng'
import { DEFAULT_WEIGHTS, scoreWithWeights, type Weights } from './weights'

export const ATOM_MASS = { C: 12.011, N: 14.007, O: 15.999, S: 32.06 } as const
export const ATOM_RADII = { C: 0.77, N: 0.75, O: 0.73, S: 1.02 } as const // van der Waals, Å

export interface AtomCounts {
  C: number
  N: number
  O: number
  S: number
}

export interface MoleculeProps {
  counts: AtomCounts
  rings: number
  mw: number
  logP: number
  hbd: number
  hba: number
}

export type MoleculeClass = 'lead' | 'candidate' | 'goldilocks' | 'far'

export interface Molecule {
  id: string
  index: number
  seed: number
  props: MoleculeProps
  score: number // 0..1 drug-likeness composite
  drugClass: MoleculeClass
  lipinskiViolations: string[]
  /** Galaxy position in scene units. */
  x: number
  y: number
  z: number
}

export interface AtomSpec {
  element: keyof AtomCounts
  x: number
  y: number
  z: number
}

export interface MolecularStructure {
  atoms: AtomSpec[]
  bonds: Array<[number, number]>
}

export type AtomElement = keyof AtomCounts

export const ELEMENT_COLORS: Record<AtomElement, string> = {
  C: '#8b95b5',
  N: '#5eb1ff',
  O: '#ff6b7a',
  S: '#ffd166',
}

export function molecularFormula(counts: AtomCounts, hydrogens: number): string {
  const parts: string[] = []
  if (counts.C > 0) parts.push(`C${counts.C}`)
  if (hydrogens === 1) parts.push('H')
  else if (hydrogens > 1) parts.push(`H${hydrogens}`)
  if (counts.N === 1) parts.push('N')
  else if (counts.N > 1) parts.push(`N${counts.N}`)
  if (counts.O === 1) parts.push('O')
  else if (counts.O > 1) parts.push(`O${counts.O}`)
  if (counts.S === 1) parts.push('S')
  else if (counts.S > 1) parts.push(`S${counts.S}`)
  return parts.join('')
}

export function heavyAtomCount(counts: AtomCounts): number {
  return counts.C + counts.N + counts.O + counts.S
}

export function molecularWeight(counts: AtomCounts): number {
  return (
    counts.C * ATOM_MASS.C +
    counts.N * ATOM_MASS.N +
    counts.O * ATOM_MASS.O +
    counts.S * ATOM_MASS.S
  )
}

/** Rough degree-of-unsaturation style estimate for the displayed H count. */
export function estimateHydrogens(counts: AtomCounts, rings: number): number {
  const raw = 2 + 2 * counts.C + counts.N - counts.O - 2 * rings
  return Math.max(0, Math.round(raw))
}

/** Crude teaching estimate: logP grows with carbon, falls with hetero atoms. */
export function estimateLogP(counts: AtomCounts, rng: Rng): number {
  const base = 0.42 * counts.C - 0.48 * counts.O - 0.28 * counts.N + 0.18 * counts.S
  const jitter = (rng() - 0.5) * 1.2
  return round2(clamp(base + jitter, -1.5, 9))
}

/** Lipinski Rule-of-Five violations, each labelled for the UI badges. */
export function lipinskiViolations(props: MoleculeProps): string[] {
  const v: string[] = []
  if (props.mw > 500) v.push('MW > 500')
  if (props.logP > 5) v.push('logP > 5')
  if (props.hbd > 5) v.push('HBD > 5')
  if (props.hba > 10) v.push('HBA > 10')
  return v
}

/**
 * Teaching score: Gaussian closeness to the oral-drug "Goldilocks zone".
 * MW ≈ 350, logP ≈ 2.5, HBD ≈ 2, HBA ≈ 5, rings ≈ 3.
 * Deliberately transparent so students can recompute it by hand.
 *
 * The weights live in `weights.ts` so the UI's weight sandbox can reuse the
 * exact same maths. Called with no second argument this is bit-identical to
 * the original hard-coded formula.
 */
export function druglikenessScore(props: MoleculeProps, weights: Weights = DEFAULT_WEIGHTS): number {
  return scoreWithWeights(props, weights)
}

export function classify(score: number): MoleculeClass {
  if (score >= 0.85) return 'goldilocks'
  if (score >= 0.6) return 'candidate'
  if (score >= 0.35) return 'lead'
  return 'far'
}

/** Draws a molecular graph: ring systems + a spanning tree, deterministic per seed. */
export function generateMoleculeProps(seed: number): MoleculeProps {
  const rng = makeRng(seed)
  const counts: AtomCounts = {
    C: 6 + Math.floor(rng() * 24), // 6..29
    N: Math.floor(rng() * 5), // 0..4
    O: Math.floor(rng() * 7), // 0..6
    S: rng() < 0.18 ? 1 : 0,
  }
  const rings = 1 + Math.floor(rng() * 4) // 1..4
  const mw = round2(molecularWeight(counts) + estimateHydrogens(counts, rings) * 1.008)
  const logP = estimateLogP(counts, rng)
  const hbd = Math.min(counts.N + counts.O, Math.floor(rng() * 4) + (counts.N > 0 ? 1 : 0))
  const hba = counts.O + Math.floor(counts.N * 0.75) + (counts.S > 0 ? 1 : 0)
  return { counts, rings, mw, logP, hbd, hba }
}

/**
 * 3D structure layout: builds the heavy-atom skeleton as a tree with ring
 * closures, then relaxes positions with a few deterministic iterations of
 * spring forces. It is a stylised ball-and-stick, NOT a conformer search.
 */
export function layoutStructure(molecule: Molecule): MolecularStructure {
  const rng = makeRng(molecule.seed ^ 0x5f3759df)
  const elements: Array<keyof AtomCounts> = []

  // Interleave hetero atoms through the carbon backbone so structures look organic.
  for (let i = 0; i < molecule.props.counts.C; i++) elements.push('C')
  const heteros: Array<keyof AtomCounts> = [
    ...Array.from({ length: molecule.props.counts.N }, () => 'N' as const),
    ...Array.from({ length: molecule.props.counts.O }, () => 'O' as const),
    ...Array.from({ length: molecule.props.counts.S }, () => 'S' as const),
  ]
  const total = elements.length + heteros.length
  const heteroSlots = new Set<number>()
  while (heteroSlots.size < heteros.length && heteroSlots.size < total - 1) {
    heteroSlots.add(1 + Math.floor(rng() * Math.max(1, total - 1)))
  }
  const skeleton: Array<keyof AtomCounts> = []
  let hetIndex = 0
  for (let i = 0; i < total; i++) {
    if (heteroSlots.has(i) && hetIndex < heteros.length) {
      skeleton.push(heteros[hetIndex++])
    } else {
      skeleton.push(elements[i - hetIndex] ?? 'C')
    }
  }

  // Tree layout: grow each atom from a random parent with a bond-length step.
  const atoms: AtomSpec[] = []
  const bonds: Array<[number, number]> = []
  const BOND = 1.55
  for (let i = 0; i < skeleton.length; i++) {
    if (i === 0) {
      atoms.push({ element: skeleton[i], x: 0, y: 0, z: 0 })
      continue
    }
    const parent = Math.floor(rng() * i)
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const p = atoms[parent]
    atoms.push({
      element: skeleton[i],
      x: p.x + BOND * Math.sin(phi) * Math.cos(theta),
      y: p.y + BOND * Math.sin(phi) * Math.sin(theta),
      z: p.z + BOND * Math.cos(phi),
    })
    bonds.push([parent, i])
  }

  // Ring closures: connect near-by unbonded pairs to suggest fused ring systems.
  let closures = molecule.props.rings - 1
  for (let i = 0; i < atoms.length && closures > 0; i++) {
    for (let j = i + 2; j < atoms.length && closures > 0; j++) {
      if (bonds.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) continue
      const d = dist(atoms[i], atoms[j])
      if (d < BOND * 1.35) {
        bonds.push([i, j])
        closures--
      }
    }
  }

  // Relaxation: pull bonded atoms to bond length, push all pairs apart slightly.
  for (let iter = 0; iter < 24; iter++) {
    for (const [a, b] of bonds) {
      const pa = atoms[a]
      const pb = atoms[b]
      const d = Math.max(0.01, dist(pa, pb))
      const force = (d - BOND) / d * 0.28
      const dx = (pb.x - pa.x) * force
      const dy = (pb.y - pa.y) * force
      const dz = (pb.z - pa.z) * force
      pa.x += dx; pa.y += dy; pa.z += dz
      pb.x -= dx; pb.y -= dy; pb.z -= dz
    }
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const pa = atoms[i]
        const pb = atoms[j]
        const d = Math.max(0.01, dist(pa, pb))
        if (d > BOND * 0.9) continue
        const push = ((BOND * 0.9 - d) / d) * 0.08
        const dx = (pb.x - pa.x) * push
        const dy = (pb.y - pa.y) * push
        const dz = (pb.z - pa.z) * push
        pa.x -= dx; pa.y -= dy; pa.z -= dz
        pb.x += dx; pb.y += dy; pb.z += dz
      }
    }
  }

  // Centre on the centroid so the structure orbits nicely.
  const c = centroid(atoms)
  for (const a of atoms) {
    a.x = round3(a.x - c.x)
    a.y = round3(a.y - c.y)
    a.z = round3(a.z - c.z)
  }
  return { atoms, bonds }
}

function dist(a: AtomSpec, b: AtomSpec): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function centroid(atoms: AtomSpec[]): AtomSpec {
  const n = Math.max(1, atoms.length)
  const sum = atoms.reduce(
    (acc, a) => ({ element: 'C' as const, x: acc.x + a.x, y: acc.y + a.y, z: acc.z + a.z }),
    { element: 'C' as const, x: 0, y: 0, z: 0 },
  )
  return { element: 'C', x: sum.x / n, y: sum.y / n, z: sum.z / n }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

/** Display id like MCX-000123, derived from the galaxy index. */
export function moleculeId(index: number): string {
  return `MCX-${String(index).padStart(6, '0')}`
}

export function seedForIndex(index: number): number {
  return (hashString(moleculeId(index)) ^ (index * 2654435761)) >>> 0
}
