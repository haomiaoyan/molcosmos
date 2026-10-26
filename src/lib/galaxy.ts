/**
 * Galaxy layout for MolCosmos.
 *
 * Conventions:
 *  - The universe holds UNIVERSE_SIZE synthetic molecules, generated once
 *    from fixed seeds — every visitor sees the same stars.
 *  - Molecules are placed on a three-arm logarithmic spiral. Score decides
 *    brightness/size/class colour, NOT position: there is no real physical
 *    meaning to the layout, it exists to make the space explorable.
 *  - A "Goldilocks ring" marks the drug-like ideal zone used by the score.
 */

import {
  classify,
  druglikenessScore,
  generateMoleculeProps,
  lipinskiViolations,
  moleculeId,
  seedForIndex,
  type Molecule,
  type MoleculeClass,
} from './molecule'
import { makeRng } from './rng'

export type { MoleculeClass } from './molecule'

export const UNIVERSE_SIZE = 600

export const CLASS_COLORS: Record<MoleculeClass, string> = {
  goldilocks: '#ffd47e',
  candidate: '#37e2c8',
  lead: '#6ea8fe',
  far: '#5a6788',
}

/** Chinese labels. Kept for tests and for search matching; the UI reads i18n. */
export const CLASS_LABELS: Record<MoleculeClass, string> = {
  goldilocks: '宜居带分子',
  candidate: '候选分子',
  lead: '先导分子',
  far: '偏远分子',
}

/** English labels, also searchable so an English visitor can type "lead". */
export const CLASS_LABELS_EN: Record<MoleculeClass, string> = {
  goldilocks: 'Goldilocks',
  candidate: 'Candidate',
  lead: 'Lead',
  far: 'Outlier',
}

/** i18n keys for the same labels, used by every component that renders them. */
export const CLASS_LABEL_KEYS = {
  goldilocks: 'class.goldilocks',
  candidate: 'class.candidate',
  lead: 'class.lead',
  far: 'class.far',
} as const

export const GALAXY_RADIUS = 64
export const GALAXY_CORE = 7
export const ARMS = 3
export const WINDINGS = 2.2

/** The violet used for every freshly generated sample. */
export const EXPLORATION_COLOR = '#b389ff'

/**
 * Ephemeral stars spawned by the generative-exploration demo (session only).
 * They are full molecules, not decorations: clicking one opens the same
 * detail panel as any other star.
 */
export interface ExplorationStar extends Molecule {
  exploration: true
}

/** Marker colour for any star: violet while it is a fresh sample, else its class colour. */
export function starColor(molecule: Molecule): string {
  return (molecule as Partial<ExplorationStar>).exploration
    ? EXPLORATION_COLOR
    : CLASS_COLORS[molecule.drugClass]
}

function buildMolecule(index: number): Molecule {
  const seed = seedForIndex(index)
  const props = generateMoleculeProps(seed)
  const score = druglikenessScore(props)
  return {
    id: moleculeId(index),
    index,
    seed,
    props,
    score,
    drugClass: classify(score),
    lipinskiViolations: lipinskiViolations(props),
    x: 0,
    y: 0,
    z: 0,
  }
}

function placeOnSpiral(molecule: Molecule, index: number, total: number): Molecule {
  const rng = makeRng(molecule.seed ^ 0x9e3779b9)
  const t = (index + rng() * 0.7) / total
  const radius = GALAXY_CORE + t * (GALAXY_RADIUS - GALAXY_CORE) + (rng() - 0.5) * 6
  const arm = index % ARMS
  const angle = (arm / ARMS) * Math.PI * 2 + t * WINDINGS * Math.PI * 2 + (rng() - 0.5) * 0.5
  const thickness = (1 - t) * 5 + 0.8
  return {
    ...molecule,
    x: round3(Math.cos(angle) * radius),
    y: round3((rng() + rng() + rng() - 1.5) * thickness),
    z: round3(Math.sin(angle) * radius),
  }
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000
}

let universeCache: Molecule[] | null = null

/** The full deterministic universe, computed once per session. */
export function universe(): Molecule[] {
  if (universeCache) return universeCache
  const molecules: Molecule[] = []
  for (let index = 0; index < UNIVERSE_SIZE; index++) {
    molecules.push(placeOnSpiral(buildMolecule(index), index, UNIVERSE_SIZE))
  }
  universeCache = molecules
  return molecules
}

export interface UniverseStats {
  total: number
  byClass: Record<MoleculeClass, number>
  best: Molecule
  meanScore: number
}

let statsCache: UniverseStats | null = null

export function universeStats(): UniverseStats {
  if (statsCache) return statsCache
  const all = universe()
  const byClass: Record<MoleculeClass, number> = { goldilocks: 0, candidate: 0, lead: 0, far: 0 }
  let sum = 0
  let best = all[0]
  for (const m of all) {
    byClass[m.drugClass] += 1
    sum += m.score
    if (m.score > best.score) best = m
  }
  statsCache = { total: all.length, byClass, best, meanScore: sum / all.length }
  return statsCache
}

/** Session-scoped registry so deep links and panels can resolve generated stars. */
const explorationIndex = new Map<string, ExplorationStar>()

/**
 * Spawns ephemeral stars for the generative-exploration demo: they cluster
 * tightly around the Goldilocks ring to visualise how a generative model
 * samples near promising regions instead of scanning the whole space.
 *
 * Each one is a real molecule with its own deterministic properties, so it can
 * be clicked and inspected exactly like a star from the fixed universe. Seeds
 * are rejected until the sampled candidate actually scores in the "very
 * promising" band — that is the point of the demo.
 */
export function spawnExplorationBatch(round: number, count = 26): ExplorationStar[] {
  const rng = makeRng(0xC0FFEE ^ (round * 7919 + 13))
  const stars: ExplorationStar[] = []
  for (let i = 0; i < count; i++) {
    // Draw seeds until the generated candidate lands in the top band. Hit rate
    // is roughly 1 in 10, so this stays cheap and deterministic.
    let seed = 0
    let props = generateMoleculeProps(0)
    let score = 0
    for (let attempt = 0; attempt < 600; attempt++) {
      seed = (rng() * 0x7fffffff) >>> 0
      props = generateMoleculeProps(seed)
      score = druglikenessScore(props)
      if (score >= 0.82) break
    }

    const t = 0.5 + (rng() - 0.5) * 0.22
    const radius = GALAXY_CORE + t * (GALAXY_RADIUS - GALAXY_CORE) + (rng() - 0.5) * 3
    const angle = rng() * Math.PI * 2
    const star: ExplorationStar = {
      id: `GEN-${String(round).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
      index: i,
      seed,
      props,
      score,
      drugClass: classify(score),
      lipinskiViolations: lipinskiViolations(props),
      x: round3(Math.cos(angle) * radius),
      y: round3((rng() - 0.5) * 2.2),
      z: round3(Math.sin(angle) * radius),
      exploration: true,
    }
    stars.push(star)
    explorationIndex.set(star.id, star)
  }
  return stars
}

/** Finds the molecule closest to a point (used by click-to-fly). */
export function nearestMolecule(all: Molecule[], x: number, y: number, z: number): Molecule | null {
  let best: Molecule | null = null
  let bestDist = Infinity
  for (const m of all) {
    const d = (m.x - x) ** 2 + (m.y - y) ** 2 + (m.z - z) ** 2
    if (d < bestDist) {
      bestDist = d
      best = m
    }
  }
  return best
}

export function findMoleculeById(id: string): Molecule | null {
  return explorationIndex.get(id) ?? universe().find((m) => m.id === id) ?? null
}
