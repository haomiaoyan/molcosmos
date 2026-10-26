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

export const UNIVERSE_SIZE = 600

export const CLASS_COLORS: Record<MoleculeClass, string> = {
  goldilocks: '#ffd47e',
  candidate: '#37e2c8',
  lead: '#6ea8fe',
  far: '#5a6788',
}

export const CLASS_LABELS: Record<MoleculeClass, string> = {
  goldilocks: '宜居带分子',
  candidate: '候选分子',
  lead: '先导分子',
  far: '偏远分子',
}

export const GALAXY_RADIUS = 64
export const GALAXY_CORE = 7
export const ARMS = 3
export const WINDINGS = 2.2

/** Ephemeral stars spawned by the generative-exploration demo (session only). */
export interface ExplorationStar {
  x: number
  y: number
  z: number
  score: number
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

/**
 * Spawns ephemeral stars for the generative-exploration demo: they cluster
 * tightly around the Goldilocks ring to visualise how a generative model
 * samples near promising regions instead of scanning the whole space.
 */
export function spawnExplorationBatch(round: number, count = 26): ExplorationStar[] {
  const rng = makeRng(0xC0FFEE ^ (round * 7919 + 13))
  const stars: ExplorationStar[] = []
  for (let i = 0; i < count; i++) {
    const t = 0.5 + (rng() - 0.5) * 0.22
    const radius = GALAXY_CORE + t * (GALAXY_RADIUS - GALAXY_CORE) + (rng() - 0.5) * 3
    const angle = rng() * Math.PI * 2
    stars.push({
      x: round3(Math.cos(angle) * radius),
      y: round3((rng() - 0.5) * 2.2),
      z: round3(Math.sin(angle) * radius),
      score: 0.82 + rng() * 0.17,
    })
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
  return universe().find((m) => m.id === id) ?? null
}
