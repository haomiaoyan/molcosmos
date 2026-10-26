import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  CLASS_COLORS,
  GALAXY_RADIUS,
  universe,
  type ExplorationStar,
} from '../lib/galaxy'
import { ELEMENT_COLORS, layoutStructure, type Molecule } from '../lib/molecule'

/* ------------------------------------------------------------------ */
/* Galaxy point cloud                                                  */
/* ------------------------------------------------------------------ */

function StarField({
  onPick,
  explorationStars,
}: {
  onPick: (m: Molecule) => void
  explorationStars: ExplorationStar[]
}) {
  const molecules = useMemo(() => universe(), [])
  const pointsRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Points>(null)

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

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    const index = event.index
    if (typeof index === 'number' && molecules[index]) onPick(molecules[index])
  }

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
        onPointerDown={handleClick}
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

  return (
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
}

export function CosmosScene({ onPick, explorationStars, focus }: CosmosSceneProps) {
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const radius = useRef(95)
  const height = useRef(38)
  const flying = useRef(0)

  useEffect(() => {
    if (focus) {
      target.current.set(focus.x, focus.y, focus.z)
      radius.current = 14
      height.current = 5
      flying.current = 1
    }
  }, [focus])

  return (
    <div className="cosmos-canvas" onDoubleClick={() => {
      target.current.set(0, 0, 0)
      radius.current = 95
      height.current = 38
      flying.current = 1
    }}>
      <Canvas
        camera={{ position: [40, 38, 80], fov: 55, near: 0.1, far: 500 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#05060f']} />
        <fog attach="fog" args={['#05060f', 120, 320]} />
        <ambientLight intensity={0.55} />
        <pointLight position={[0, 30, 0]} intensity={1.4} color="#aab8ff" distance={200} />
        <StarField onPick={onPick} explorationStars={explorationStars} />
        <DustLayer />
        <OrbitRig target={target} radius={radius} height={height} flying={flying} />
      </Canvas>
    </div>
  )
}

/**
 * Gentle auto-orbit with damping; double-click resets the view. The camera
 * eases toward the current focus instead of jumping.
 */
function OrbitRig({
  target,
  radius,
  height,
  flying,
}: {
  target: React.MutableRefObject<THREE.Vector3>
  radius: React.MutableRefObject<number>
  height: React.MutableRefObject<number>
  flying: React.MutableRefObject<number>
}) {
  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime()
    const wantAngle = t * 0.05
    const wantPos = new THREE.Vector3(
      target.current.x + Math.cos(wantAngle) * radius.current,
      target.current.y + height.current,
      target.current.z + Math.sin(wantAngle) * radius.current,
    )
    const speed = flying.current > 0 ? 0.06 : 0.18
    camera.position.lerp(wantPos, 1 - Math.exp(-speed * 60 * delta))
    flying.current = Math.max(0, flying.current - delta * 0.8)
    camera.lookAt(target.current)
  })
  return null
}
