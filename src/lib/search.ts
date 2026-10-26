/**
 * Query matching for the cosmos search box.
 *
 * Three things are searchable, because they are the three ways a visitor
 * thinks about a star: its catalogue id (MCX-000123, or just "123"), its
 * molecular formula (C24H44N2O6), and its Chinese class label.
 *
 * Kept free of React and of the scene so it can be tested directly.
 */

import { CLASS_LABELS, CLASS_LABELS_EN, universe } from './galaxy'
import { estimateHydrogens, molecularFormula, type Molecule } from './molecule'

export type HitReason = 'id' | 'formula' | 'class'

export interface SearchHit {
  molecule: Molecule
  reason: HitReason
}

/** Formula as the panel shows it (heavy atoms plus estimated hydrogens). */
export function formulaOf(molecule: Molecule): string {
  const { counts, rings } = molecule.props
  return molecularFormula(counts, estimateHydrogens(counts, rings))
}

interface Scored {
  hit: SearchHit
  rank: number
}

function scoreId(id: string, query: string): number | null {
  const lower = id.toLowerCase()
  const digits = lower.replace(/^mcx-?/, '')
  if (lower === query) return 0
  if (digits === query) return 1
  if (digits.startsWith(query)) return 2
  if (lower.startsWith(query)) return 3
  if (lower.includes(query)) return 4
  return null
}

/**
 * @param query  raw user input; whitespace is ignored, case is folded
 * @param extra  session-only molecules (generated samples) to include
 * @param limit  maximum hits returned
 */
export function searchMolecules(query: string, extra: Molecule[] = [], limit = 8): SearchHit[] {
  const raw = query.trim()
  if (!raw) return []
  const q = raw.toLowerCase()
  const scored: Scored[] = []

  for (const molecule of [...universe(), ...extra]) {
    const idScore = scoreId(molecule.id, q)
    if (idScore !== null) {
      scored.push({ hit: { molecule, reason: 'id' }, rank: idScore })
      continue
    }
    const formula = formulaOf(molecule).toLowerCase()
    if (formula === q) {
      scored.push({ hit: { molecule, reason: 'formula' }, rank: 1 })
      continue
    }
    if (formula.includes(q)) {
      scored.push({ hit: { molecule, reason: 'formula' }, rank: 5 })
      continue
    }
    // Both label sets match, so an English visitor can type "lead".
    const zhLabel = CLASS_LABELS[molecule.drugClass]
    const enLabel = CLASS_LABELS_EN[molecule.drugClass]
    if (zhLabel.includes(raw) || enLabel.toLowerCase().includes(q)) {
      scored.push({ hit: { molecule, reason: 'class' }, rank: 6 })
    }
  }

  scored.sort((a, b) => a.rank - b.rank || a.hit.molecule.index - b.hit.molecule.index)
  return scored.slice(0, limit).map((s) => s.hit)
}

/** Next / previous star in catalogue order, wrapping at both ends. */
export function stepUniverse(all: readonly Molecule[], current: Molecule | null, delta: number): Molecule {
  if (all.length === 0) throw new Error('empty universe')
  const at = current ? all.findIndex((m) => m.id === current.id) : -1
  // A generated star is not in the catalogue; start from the beginning.
  const base = at < 0 ? (delta > 0 ? -1 : 0) : at
  const next = (((base + delta) % all.length) + all.length) % all.length
  return all[next]
}
