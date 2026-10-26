import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  CLASS_COLORS,
  GALAXY_RADIUS,
  universe,
  type ExplorationStar,
} from '../lib/galaxy'
import { ELEMENT_COLORS, layoutStructure, type Molecule } from '../lib/molecule'
import { nearestOnScreen, toNdc } from '../lib/pick'

/* ------------------------------------------------------------------ */
/* Galaxy point cloud                                                  */
/* ------------------------------------------------------------------ */

function StarField({
  onPick,
  explorationStars,
  selected,
}: {
  onPick: (m: Molecule) => void
  explorationStars: ExplorationStar[]
  selected?: Molecule | null
}) {
  const molecules = useMemo(() => universe(), [])
  const pointsRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Points>(null)
  const { camera, gl } = useThree()

  const { geometry, haloGeometry } = useMemo(() => {
    const positions = new Float32Array(molecules.length * 3)
    const colors = new Float32Array(molecules.length * 3)
    const sizes = new Float32Array(molecules.length)

    const haloPositions = new Float32Array(molecules.length * 3)
    const haloColors = new Float32Array(molecules.length * 3)
    const haloSizes = new Float32Array(molecules.length)

    const color = new THREE.Color()
    molecules.forEach((m, i) => {
      positions[i * 3] = m.x
      positions[i * 3 + 1] = m.y
      positions[i * 3 + 2] = m.z
      color.set(CLASS_COLORS[m.drugClass])
      // Brighter stars for higher scores — the "AI 打分" made visible.
      const boost = 0.55 + m.score * 0.45
      colors[i * 3] = color.r * boost
      colors[i * 3 + 1] = color.g * boost
      colors[i * 3 + 2] = color.b * boost
      sizes[i] = 0.45 + m.score * 1.15

      haloPositions[i * 3] = m.x
      haloPositions[i * 3 + 1] = m.y
      haloPositions[i * 3 + 2] = m.z
      haloColors[i * 3] = color.r
      haloColors[i * 3 + 1] = color.g
      haloColors[i * 3 + 2] = color.b
      haloSizes[i] = (0.45 + m.score * 1.15) * 4.5
    })

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

    const haloGeometry = new THREE.BufferGeometry()
    haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3))
    haloGeometry.setAttribute('color', new THREE.BufferAttribute(haloColors, 3))
    haloGeometry.setAttribute('aSize', new THREE.BufferAttribute(haloSizes, 1))

    return { geometry, haloGeometry }
  }, [molecules])

  const { expGeometry, expHaloGeometry } = useMemo(() => {
    const count = explorationStars.length
    if (count === 0) return { expGeometry: null, expHaloGeometry: null }
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const haloSizes = new Float32Array(count)
    const color = new THREE.Color('#b389ff')
    explorationStars.forEach((s, i) => {
      positions[i * 3] = s.x
      positions[i * 3 + 1] = s.y
      positions[i * 3 + 2] = s.z
      const boost = 0.6 + s.score * 0.4
      colors[i * 3] = color.r * boost
      colors[i * 3 + 1] = color.g * boost
      colors[i * 3 + 2] = color.b * boost
      sizes[i] = 1.1 + s.score * 0.8
      haloSizes[i] = (1.1 + s.score * 0.8) * 5
    })
    const expGeometry = new THREE.BufferGeometry()
    expGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    expGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    expGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    const expHaloGeometry = new THREE.BufferGeometry()
    expHaloGeometry.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    expHaloGeometry.setAttribute('color', new THREE.BufferAttribute(colors.slice(), 3))
    expHaloGeometry.setAttribute('aSize', new THREE.BufferAttribute(haloSizes, 1))
    return { expGeometry, expHaloGeometry }
  }, [explorationStars])

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const material = pointsRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = clock.getElapsedTime()
    }
    if (haloRef.current) {
      const material = haloRef.current.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  // Materials must be created unconditionally — hooks cannot live inside
  // the conditional JSX below or the hook count changes when exploration
  // stars first appear, crashing the canvas.
  const expHaloMaterial = useMemo(() => makeStarMaterial('halo', '#b389ff'), [])
  const expCoreMaterial = useMemo(() => makeStarMaterial('core', '#b389ff'), [])

  // Screen-space picking. Raycasting against a Points cloud needs a tiny
  // hit threshold that becomes unusable at galaxy scale, so instead we
  // project every star to NDC and take the nearest one to the pointer.
  useEffect(() => {
    const el = gl.domElement
    const ndc = new THREE.Vector3()
    let downX = 0
    let downY = 0
    let downAt = 0

    const hitTest = (clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const p = toNdc(clientX, clientY, rect)
      return nearestOnScreen(
        molecules,
        (m) => {
          ndc.set(m.x, m.y, m.z).project(camera)
          return { x: ndc.x, y: ndc.y, z: ndc.z }
        },
        p.x,
        p.y,
        0.05,
      )
    }

    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX
      downY = event.clientY
      downAt = performance.now()
    }

    const handleClick = (event: MouseEvent) => {
      // Ignore the click that ends an orbit drag.
      if (performance.now() - downAt > 700) return
      if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return
      const hit = hitTest(event.clientX, event.clientY)
      if (hit) onPick(hit.item)
    }

    const handleMove = (event: PointerEvent) => {
      el.style.cursor = hitTest(event.clientX, event.clientY) ? 'pointer' : 'grab'
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('click', handleClick)
    el.addEventListener('pointermove', handleMove)
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('click', handleClick)
      el.removeEventListener('pointermove', handleMove)
    }
  }, [camera, gl, molecules, onPick])

  return (
    <group>
      <points
        ref={haloRef}
        geometry={haloGeometry}
        material={useMemo(() => makeStarMaterial('halo'), [])}
        renderOrder={1}
      />
      <points
        ref={pointsRef}
        geometry={geometry}
        material={useMemo(() => makeStarMaterial('core'), [])}
        renderOrder={2}
      />
      {expGeometry && expHaloGeometry && (
        <>
          <points
            geometry={expHaloGeometry}
            material={expHaloMaterial}
            renderOrder={3}
          />
          <points
            geometry={expGeometry}
            material={expCoreMaterial}
            renderOrder={4}
          />
        </>
      )}
      <GoldilocksRing />
      {selected && <SelectedStarMarker molecule={selected} />}
    </group>
  )
}

/**
 * Marks the star the user is currently inspecting: a pulsing ring in the
 * star's own class colour plus a crosshair reticle and a floating label, so
 * the selection is unmistakable even while the camera is still flying in.
 */
function SelectedStarMarker({ molecule }: { molecule: Molecule }) {
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const steadyRef = useRef<THREE.Mesh>(null)
  const color = CLASS_COLORS[molecule.drugClass]

  // A sprite without a texture renders as a hard white square, so the glow
  // needs a real radial-gradient texture.
  const glowTexture = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      g.addColorStop(0, 'rgba(255,255,255,1)')
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
      g.addColorStop(0.55, 'rgba(255,255,255,0.14)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // Two rings expanding outward on a 2s cycle, like a sonar ping.
    if (ringRef.current) {
      const p = (t * 0.5) % 1
      ringRef.current.scale.setScalar(1 + p * 2.4)
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - p) * 0.7
    }
    if (ring2Ref.current) {
      const p = ((t * 0.5) + 0.5) % 1
      ring2Ref.current.scale.setScalar(1 + p * 2.4)
      const mat = ring2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - p) * 0.7
    }
    if (steadyRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.04
      steadyRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={[molecule.x, molecule.y, molecule.z]}>
      <sprite scale={[4.2, 4.2, 1]} renderOrder={5}>
        <spriteMaterial
          map={glowTexture}
          color={color}
          transparent
          opacity={0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Steady ring marking the exact position. */}
      <mesh ref={steadyRef} renderOrder={6}>
        <ringGeometry args={[0.62, 0.74, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>

      <mesh ref={ringRef} renderOrder={6}>
        <ringGeometry args={[0.95, 1.06, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh ref={ring2Ref} renderOrder={6}>
        <ringGeometry args={[0.95, 1.06, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          side={THREE.DoubleSide}
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <Html
        center
        distanceFactor={13}
        position={[0, 2.5, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
        zIndexRange={[20, 0]}
      >
        <div className="star-tag" style={{ borderColor: color, color }}>
          {molecule.id}
        </div>
      </Html>
    </group>
  )
}

/** The "宜居带" ring — where the teaching score believes oral drugs live. */
function GoldilocksRing() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = clock.getElapsedTime() * 0.05
      const material = ref.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.07 + Math.sin(clock.getElapsedTime() * 0.8) * 0.03
    }
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[GALAXY_RADIUS * 0.52, GALAXY_RADIUS * 0.66, 128]} />
      <meshBasicMaterial
        color="#ffd47e"
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function makeStarMaterial(variant: 'core' | 'halo', tint?: string) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(tint ?? '#ffffff') },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.85 + 0.15 * sin(uTime * 1.4 + position.x * 3.7 + position.z * 2.3);
        gl_PointSize = aSize * twinkle * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader:
      variant === 'core'
        ? /* glsl */ `
      varying vec3 vColor;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.05, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `
        : /* glsl */ `
      varying vec3 vColor;
      uniform vec3 uTint;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = pow(1.0 - smoothstep(0.0, 0.5, d), 2.2) * 0.28;
        gl_FragColor = vec4(vColor * mix(vec3(1.0), uTint, 0.4), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
  })
}

/* ------------------------------------------------------------------ */
/* Ambient dust + background nebula                                    */
/* ------------------------------------------------------------------ */

function DustLayer({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 70 + Math.random() * 60
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.4
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [count])

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.008
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.28}
        color="#8b9bc4"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/* Molecular structure viewer                                          */
/* ------------------------------------------------------------------ */

export function MolecularStructure3D({
  molecule,
  autoRotate = true,
}: {
  molecule: Molecule
  autoRotate?: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { atoms, bonds } = useMemo(() => layoutStructure(molecule), [molecule])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.45
    }
  })

  // Frame the structure: the layout spans a few bond lengths, so scale the
  // camera distance with the atom count instead of using a fixed zoom.
  const extent = useMemo(() => {
    let max = 0
    for (const a of atoms) max = Math.max(max, Math.hypot(a.x, a.y, a.z))
    return Math.max(2.5, max)
  }, [atoms])

  return (
    <>
      <PerspectiveCameraSync extent={extent} />
      <group ref={groupRef}>
        {atoms.map((atom, i) => {
          const radius = atom.element === 'S' ? 0.34 : atom.element === 'C' ? 0.26 : 0.24
          return (
            <mesh key={`a${i}`} position={[atom.x, atom.y, atom.z]}>
              <sphereGeometry args={[radius, 20, 20]} />
              <meshStandardMaterial
                color={ELEMENT_COLORS[atom.element]}
                emissive={ELEMENT_COLORS[atom.element]}
                emissiveIntensity={0.35}
                roughness={0.35}
                metalness={0.1}
              />
            </mesh>
          )
        })}
        {bonds.map(([a, b], i) => (
          <Bond key={`b${i}`} a={atoms[a]} b={atoms[b]} />
        ))}
      </group>
    </>
  )
}

/** Keeps the camera far enough back to see the whole molecule. */
function PerspectiveCameraSync({ extent }: { extent: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const distance = extent * 2.05 + 1.4
    camera.position.set(distance * 0.5, distance * 0.34, distance * 0.8)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, extent])
  return null
}

/** A self-contained canvas for the molecule detail panel. */
export function MolecularStructureCanvas({ molecule }: { molecule: Molecule }) {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 200, position: [8, 6, 14] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 8]} intensity={1.5} />
      <pointLight position={[-8, -4, -6]} intensity={0.9} color="#a78bfa" />
      <MolecularStructure3D molecule={molecule} />
    </Canvas>
  )
}

function Bond({ a, b }: { a: { x: number; y: number; z: number }; b: { x: number; y: number; z: number } }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(a.x, a.y, a.z)
    const end = new THREE.Vector3(b.x, b.y, b.z)
    const dir = new THREE.Vector3().subVectors(end, start)
    const length = dir.length()
    const midpoint = start.clone().add(end).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { midpoint, quaternion, length }
  }, [a, b])

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.055, 0.055, length, 10]} />
      <meshStandardMaterial color="#c9d4ff" roughness={0.5} metalness={0.2} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Scene wrapper                                                       */
/* ------------------------------------------------------------------ */

interface CosmosSceneProps {
  onPick: (m: Molecule) => void
  explorationStars: ExplorationStar[]
  focus?: { x: number; y: number; z: number } | null
  selected?: Molecule | null
}

export function CosmosScene({ onPick, explorationStars, focus, selected }: CosmosSceneProps) {
  const controlsRef = useRef<any>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const fly = useRef({
    active: false,
    pos: new THREE.Vector3(40, 38, 80),
    look: new THREE.Vector3(0, 0, 0),
  })

  useEffect(() => {
    if (!focus) return
    const look = new THREE.Vector3(focus.x, focus.y, focus.z)
    // Park the camera a comfortable distance away, slightly above the star.
    const dir = new THREE.Vector3(0.35, 0.42, 1).normalize()
    const distance = 13

    // The detail panel covers the right edge of the stage, so centring the
    // star would hide it behind the panel. Slide the orbit target sideways by
    // half the panel width, expressed in world units at the new distance.
    const width = wrapRef.current?.clientWidth ?? 0
    const PANEL_PX = Math.min(340, width * 0.42)
    let target = look
    if (width > 480) {
      const halfHeight = Math.tan((55 * Math.PI) / 360) * distance
      const worldPerPx = (2 * halfHeight) / (wrapRef.current?.clientHeight ?? 1)
      const shift = (PANEL_PX / 2) * worldPerPx
      const right = new THREE.Vector3().crossVectors(
        new THREE.Vector3(0, 1, 0),
        dir,
      ).normalize()
      target = look.clone().addScaledVector(right, shift)
    }

    fly.current = { active: true, pos: target.clone().addScaledVector(dir, distance), look: target }
  }, [focus])

  const resetView = () => {
    fly.current = {
      active: true,
      pos: new THREE.Vector3(40, 38, 80),
      look: new THREE.Vector3(0, 0, 0),
    }
  }

  return (
    <div className="cosmos-canvas" onDoubleClick={resetView} ref={wrapRef}>
      <Canvas
        camera={{ position: [40, 38, 80], fov: 55, near: 0.1, far: 500 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#05060f']} />
        <fog attach="fog" args={['#05060f', 120, 320]} />
        <ambientLight intensity={0.55} />
        <pointLight position={[0, 30, 0]} intensity={1.4} color="#aab8ff" distance={200} />
        <StarField
          onPick={onPick}
          explorationStars={explorationStars}
          selected={selected}
        />
        <DustLayer />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.07}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.35}
          minDistance={6}
          maxDistance={220}
          rotateSpeed={0.55}
          zoomSpeed={0.8}
        />
        <FlyRig controls={controlsRef} fly={fly} />
      </Canvas>
    </div>
  )
}

/**
 * Eases the camera toward a focus target. OrbitControls keeps ownership of
 * the camera at all times, so dragging and zooming stay responsive; auto
 * orbit pauses while a flight is in progress.
 */
function FlyRig({
  controls,
  fly,
}: {
  controls: React.MutableRefObject<any>
  fly: React.MutableRefObject<{ active: boolean; pos: THREE.Vector3; look: THREE.Vector3 }>
}) {
  useFrame(({ camera }, delta) => {
    const c = controls.current
    if (c) c.autoRotate = !fly.current.active
    if (!fly.current.active) return
    const k = 1 - Math.exp(-4 * delta)
    camera.position.lerp(fly.current.pos, k)
    if (c) {
      c.target.lerp(fly.current.look, k)
      c.update()
    }
    if (camera.position.distanceTo(fly.current.pos) < 0.4) fly.current.active = false
  })
  return null
}
