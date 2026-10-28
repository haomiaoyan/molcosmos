/**
 * Geometry for the decorative molecule that spins next to the hero title.
 *
 * Four fixed molecules, all taken from the highest-scoring Goldilocks stars in
 * the catalogue, so the animation shows real entries from the universe below
 * rather than invented artwork. Coordinates come from the same
 * `layoutStructure()` spring layout the detail panel renders in 3D.
 *
 * Output is expressed in CSS pixels relative to the centre of the animation
 * box, ready for `translate3d()`; no WebGL context is created.
 */

import { findMoleculeById } from './galaxy'
import {
  estimateHydrogens,
  layoutStructure,
  molecularFormula,
  type AtomElement,
} from './molecule'

/**
 * Chosen for element-colour variety, not for ranking: `MCX-000180` is the
 * highest-scoring star in the catalogue, `MCX-000402` is the only sulfur-rich
 * one in the top set, `MCX-000046` is carbon/oxygen only and `MCX-000173` is
 * the most elongated of the four.
 */
export const HERO_MOLECULE_IDS = [
  'MCX-000180', // 0.965 · C16H23NO6
  'MCX-000402', // 0.932 · C14H21N2O5S
  'MCX-000046', // 0.946 · C14H18O6
  'MCX-000173', // 0.939 · C14H23N2O5
] as const

/** Diameter of one animation frame, in CSS pixels. */
export const HERO_BOX = 240

export interface HeroAtom {
  key: string
  element: AtomElement
  /** Centre position in px, relative to the animation box centre. */
  x: number
  y: number
  z: number
  /** Diameter in px. */
  size: number
}

export interface HeroBond {
  key: string
  /** Index of the first atom in `HeroModel.atoms`. */
  from: number
  /** Index of the second atom in `HeroModel.atoms`. */
  to: number
  /** Midpoint in px, relative to the animation box centre. */
  x: number
  y: number
  z: number
  /** Length in px. */
  length: number
  /** Rotation about Z that aims the bond's local +X along the bond. */
  theta: number
  /** Rotation about Y applied after theta; see the CSS transform recipe. */
  phi: number
  /** Thickness in px, per plane of the crossed cross-section. */
  thickness: number
}

export interface HeroModel {
  id: string
  formula: string
  atoms: HeroAtom[]
  bonds: HeroBond[]
  /** Largest atom distance from the centre, in px — the model fits a sphere. */
  radius: number
}

/** Ball-and-stick radii, in units of the box size. Sulfur reads slightly bigger. */
const ELEMENT_SCALE: Record<AtomElement, number> = {
  C: 1,
  N: 1,
  O: 1.04,
  S: 1.2,
}

/**
 * Project one catalogue molecule into CSS-pixel coordinates.
 *
 * `size` is the edge of the square animation box; the molecule is scaled to fit
 * a sphere of 92% of that box, so it never clips while it spins.
 */
export function buildHeroModel(id: string, size = HERO_BOX): HeroModel | null {
  const molecule = findMoleculeById(id)
  if (!molecule) return null

  const layout = layoutStructure(molecule)
  if (layout.atoms.length === 0) return null

  const n = layout.atoms.length
  const cx = layout.atoms.reduce((sum, a) => sum + a.x, 0) / n
  const cy = layout.atoms.reduce((sum, a) => sum + a.y, 0) / n
  const cz = layout.atoms.reduce((sum, a) => sum + a.z, 0) / n

  const centered = layout.atoms.map((a) => ({
    element: a.element,
    x: a.x - cx,
    y: a.y - cy,
    z: a.z - cz,
  }))
  const radius = Math.max(...centered.map((a) => Math.hypot(a.x, a.y, a.z)), 1e-6)
  const scale = (size * 0.46) / radius

  const atoms: HeroAtom[] = centered.map((a, i) => ({
    key: `a${i}`,
    element: a.element,
    x: round2(a.x * scale),
    y: round2(a.y * scale),
    z: round2(a.z * scale),
    size: round2(size * 0.032 * ELEMENT_SCALE[a.element]),
  }))

  const thickness = round2(size * 0.011)
  const bonds: HeroBond[] = layout.bonds.map(([from, to], i) => {
    const a = centered[from]
    const b = centered[to]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const dz = b.z - a.z
    const length = Math.hypot(dx, dy, dz)
    // Align the bond's local +X with the direction vector:
    // Rz(theta)·Ry(phi)·x̂ = (cosθ·cosφ, sinθ·cosφ, −sinφ).
    const planar = Math.hypot(dx, dy) || 1e-6
    return {
      key: `b${i}`,
      from,
      to,
      x: round2(((a.x + b.x) / 2) * scale),
      y: round2(((a.y + b.y) / 2) * scale),
      z: round2(((a.z + b.z) / 2) * scale),
      length: round2(length * scale),
      theta: round2(toDegrees(Math.atan2(dy, dx))),
      phi: round2(toDegrees(-Math.atan2(dz, planar))),
      thickness,
    }
  })

  const hydrogens = estimateHydrogens(molecule.props.counts, molecule.props.rings)

  return {
    id: molecule.id,
    formula: molecularFormula(molecule.props.counts, hydrogens),
    atoms,
    bonds,
    radius: round2(radius * scale),
  }
}

/** All four hero models, built once at module scope. */
export const HERO_MODELS: readonly HeroModel[] = HERO_MOLECULE_IDS.map((id) => buildHeroModel(id)).filter(
  (model): model is HeroModel => model !== null,
)

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}
