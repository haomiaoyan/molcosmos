/**
 * Screen-space nearest-neighbour picking.
 *
 * Raycasting a THREE.Points cloud requires a ray threshold measured in world
 * units, which is unusable when stars are spread over ~130 units and the
 * camera sits 80+ units away. Projecting every candidate to normalised device
 * coordinates and comparing against the pointer position is exact, cheap for a
 * few hundred stars, and trivially testable.
 */

export interface ScreenSpacePoint {
  x: number
  y: number
  z: number
}

export interface PickResult<T> {
  item: T
  dist: number
}

/**
 * @param items      candidates carrying world positions
 * @param project    world -> NDC projection (z > 1 means behind the camera)
 * @param px,py      pointer position in NDC (-1..1)
 * @param maxDist    maximum NDC distance that still counts as a hit
 */
export function nearestOnScreen<T>(
  items: readonly T[],
  project: (item: T) => ScreenSpacePoint,
  px: number,
  py: number,
  maxDist: number,
): PickResult<T> | null {
  let best: T | null = null
  let bestDist = Infinity
  for (const item of items) {
    const p = project(item)
    if (p.z > 1) continue
    const d = Math.hypot(p.x - px, p.y - py)
    if (d < bestDist) {
      bestDist = d
      best = item
    }
  }
  if (!best || bestDist > maxDist) return null
  return { item: best, dist: bestDist }
}

/** Convert a pointer position inside an element into NDC coordinates. */
export function toNdc(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -((clientY - rect.top) / rect.height) * 2 + 1,
  }
}
