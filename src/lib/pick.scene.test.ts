import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { nearestOnScreen, toNdc } from './pick'

/**
 * End-to-end check of the picking pipeline against a real three.js camera.
 * These values mirror the shipped scene: fov 55, camera parked at
 * (40, 38, 80) looking at the origin, stars spread across a ~130-unit galaxy.
 */
function makeCamera() {
  const camera = new PerspectiveCamera(55, 16 / 9, 0.1, 500)
  camera.position.set(40, 38, 80)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld(true)
  return camera
}

const rect = { left: 0, top: 0, width: 1600, height: 900 }

/** Where a world point lands on screen, in CSS pixels. */
function projectToScreen(camera: PerspectiveCamera, x: number, y: number, z: number) {
  const ndc = new Vector3(x, y, z).project(camera)
  return {
    clientX: ((ndc.x + 1) / 2) * rect.width + rect.left,
    clientY: ((1 - ndc.y) / 2) * rect.height + rect.top,
  }
}

describe('picking at galaxy scale', () => {
  const camera = makeCamera()
  const stars = [
    { id: 'core', x: 0, y: 0, z: 0 },
    { id: 'arm-a', x: 22, y: 3, z: -14 },
    { id: 'arm-b', x: -31, y: -2, z: 18 },
    { id: 'far', x: 58, y: 6, z: 42 },
  ]

  const pickAt = (clientX: number, clientY: number) => {
    const p = toNdc(clientX, clientY, rect)
    const ndc = new Vector3()
    return nearestOnScreen(
      stars,
      (s) => {
        ndc.set(s.x, s.y, s.z).project(camera)
        return { x: ndc.x, y: ndc.y, z: ndc.z }
      },
      p.x,
      p.y,
      0.05,
    )
  }

  it('hits each star when clicking exactly on it', () => {
    for (const star of stars) {
      const screen = projectToScreen(camera, star.x, star.y, star.z)
      const hit = pickAt(screen.clientX, screen.clientY)
      expect(hit?.item.id).toBe(star.id)
    }
  })

  it('still hits when the pointer is a few pixels off', () => {
    const screen = projectToScreen(camera, 22, 3, -14)
    const hit = pickAt(screen.clientX + 3, screen.clientY - 2)
    expect(hit?.item.id).toBe('arm-a')
  })

  it('misses the empty sky between stars', () => {
    // A corner of the viewport with no star nearby.
    expect(pickAt(20, 20)).toBeNull()
  })

  it('prefers the star closest to the pointer', () => {
    const a = projectToScreen(camera, 22, 3, -14)
    const b = projectToScreen(camera, 0, 0, 0)
    // Pointer just shy of star A, towards B.
    const x = a.clientX + (b.clientX - a.clientX) * 0.1
    const y = a.clientY + (b.clientY - a.clientY) * 0.1
    expect(pickAt(x, y)?.item.id).toBe('arm-a')
  })

  it('keeps the hit radius usable at the default zoom', () => {
    // Sanity check that 0.05 NDC is not an impossibly small target:
    // it corresponds to this many pixels of slack.
    const pixels = 0.05 * (rect.width / 2)
    expect(pixels).toBeGreaterThan(20)
  })
})
