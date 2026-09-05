import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useLab } from '../store/labStore'
import { useApp } from '../store/appStore'
import Trail, { type TrailHandle } from './Trail'
import type { Palette } from './usePalette'

// Planar double pendulum, Lagrangian equations of motion integrated with RK4
// at a fixed 240 Hz sub-step (Euler visibly pumps energy into this system).
const L1 = 1.15
const L2 = 1.05
const M1 = 1.0
const M2 = 1.0
const DT = 1 / 240
const PIVOT = new THREE.Vector3(0, 1.95, 0)
const MAX_GHOSTS = 8
const UP = new THREE.Vector3(0, 1, 0)

type State = [number, number, number, number] // θ1, ω1, θ2, ω2

function deriv(s: State, g: number, c: number, out: State) {
  const [t1, w1, t2, w2] = s
  const d = t1 - t2
  const sd = Math.sin(d)
  const cd = Math.cos(d)
  const den = 2 * M1 + M2 - M2 * Math.cos(2 * d)
  const a1 = (-g * (2 * M1 + M2) * Math.sin(t1) - M2 * g * Math.sin(t1 - 2 * t2)
    - 2 * sd * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * cd)) / (L1 * den)
  const a2 = (2 * sd * (w1 * w1 * L1 * (M1 + M2) + g * (M1 + M2) * Math.cos(t1) + w2 * w2 * L2 * M2 * cd)) / (L2 * den)
  out[0] = w1
  out[1] = a1 - c * w1
  out[2] = w2
  out[3] = a2 - c * w2
}

const k1: State = [0, 0, 0, 0]
const k2: State = [0, 0, 0, 0]
const k3: State = [0, 0, 0, 0]
const k4: State = [0, 0, 0, 0]
const tmp: State = [0, 0, 0, 0]

function rk4(s: State, h: number, g: number, c: number) {
  deriv(s, g, c, k1)
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (h / 2) * k1[i]
  deriv(tmp, g, c, k2)
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + (h / 2) * k2[i]
  deriv(tmp, g, c, k3)
  for (let i = 0; i < 4; i++) tmp[i] = s[i] + h * k3[i]
  deriv(tmp, g, c, k4)
  for (let i = 0; i < 4; i++) s[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])
}

function tip1(s: State, out: THREE.Vector3) {
  return out.set(PIVOT.x + L1 * Math.sin(s[0]), PIVOT.y - L1 * Math.cos(s[0]), 0)
}
function tip2(s: State, out: THREE.Vector3) {
  return out.set(PIVOT.x + L1 * Math.sin(s[0]) + L2 * Math.sin(s[2]), PIVOT.y - L1 * Math.cos(s[0]) - L2 * Math.cos(s[2]), 0)
}

function placeRod(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  mesh.position.copy(a).addScaledVector(dir, 0.5)
  mesh.scale.set(1, len, 1)
  mesh.quaternion.setFromUnitVectors(UP, dir.normalize())
}

const GHOST_HUES: (keyof Palette)[] = ['green', 'violet', 'amber', 'pink', 'red', 'cyan', 'muted', 'text']

export default function DoublePendulum({ pal, controlsRef }: { pal: Palette; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const params = useLab((s) => s.pendulum)
  const resetSeq = useLab((s) => s.resetSeq)
  const setReadout = useLab((s) => s.setReadout)
  const unlock = useApp((s) => s.unlock)
  const mode = useApp((s) => s.mode)

  const main = useRef<State>([params.th1, 0, params.th2, 0])
  const ghosts = useRef<State[]>([])
  const acc = useRef(0)
  const simTime = useRef(0)
  const frame = useRef(0)
  const dragging = useRef<0 | 1 | 2>(0)
  const [hover, setHover] = useState(false)

  const rod1 = useRef<THREE.Mesh>(null!)
  const rod2 = useRef<THREE.Mesh>(null!)
  const bob1 = useRef<THREE.Mesh>(null!)
  const bob2 = useRef<THREE.Mesh>(null!)
  const ghostBobs = useRef<(THREE.Mesh | null)[]>([])
  const mainTrail = useRef<TrailHandle>(null)
  const ghostTrails = useRef<(TrailHandle | null)[]>([])
  const groupRef = useRef<THREE.Group>(null!)

  const v1 = useMemo(() => new THREE.Vector3(), [])
  const v2 = useMemo(() => new THREE.Vector3(), [])
  const v3 = useMemo(() => new THREE.Vector3(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])

  const seedGhosts = (count: number) => {
    ghosts.current = Array.from({ length: count }, (_, i) => {
      const eps = 1e-3 * (i + 1) * (i % 2 === 0 ? 1 : -1)
      return [main.current[0] + eps, main.current[1], main.current[2] - eps * 0.5, main.current[3]] as State
    })
    ghostTrails.current.forEach((t) => t?.clear())
  }

  // reset: re-seed from the stored initial angles
  useEffect(() => {
    main.current = [params.th1, 0, params.th2, 0]
    simTime.current = 0
    mainTrail.current?.clear()
    seedGhosts(params.ghosts)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSeq])

  // ghost count changed: re-seed around the current main state
  useEffect(() => { seedGhosts(params.ghosts) }, [params.ghosts]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.cursor = dragging.current ? 'grabbing' : hover ? 'grab' : 'auto'
    return () => { document.body.style.cursor = 'auto' }
  }, [hover])

  const beginDrag = (which: 1 | 2) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    dragging.current = which
    if (controlsRef.current) controlsRef.current.enabled = false
    ;(e.target as Element).setPointerCapture(e.pointerId)
    mainTrail.current?.clear()
    ghostTrails.current.forEach((t) => t?.clear())
    document.body.style.cursor = 'grabbing'
    unlock('physicist')
  }

  const moveDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    groupRef.current.getWorldPosition(v3)
    plane.constant = -v3.z
    if (!e.ray.intersectPlane(plane, hit)) return
    hit.sub(v3) // to group-local
    const s = main.current
    if (dragging.current === 1) {
      s[0] = Math.atan2(hit.x - PIVOT.x, PIVOT.y - hit.y)
    } else {
      tip1(s, v1)
      s[2] = Math.atan2(hit.x - v1.x, v1.y - hit.y)
    }
    s[1] = 0
    s[3] = 0
  }

  const endDrag = (e: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return
    dragging.current = 0
    ;(e.target as Element).releasePointerCapture(e.pointerId)
    if (controlsRef.current) controlsRef.current.enabled = true
    seedGhosts(params.ghosts)
    simTime.current = 0
    document.body.style.cursor = hover ? 'grab' : 'auto'
  }

  useFrame((_, delta) => {
    const s = main.current
    if (!params.paused && !dragging.current) {
      acc.current += Math.min(delta, 0.05) * params.speed
      while (acc.current >= DT) {
        rk4(s, DT, params.gravity, params.damping)
        for (const gs of ghosts.current) rk4(gs, DT, params.gravity, params.damping)
        acc.current -= DT
        simTime.current += DT
      }
    }

    tip1(s, v1)
    tip2(s, v2)
    placeRod(rod1.current, PIVOT, v1)
    placeRod(rod2.current, v1, v2)
    bob1.current.position.copy(v1)
    bob2.current.position.copy(v2)
    if (!dragging.current && !params.paused) mainTrail.current?.push(v2.x, v2.y, 0.005)

    let spread = 0
    ghosts.current.forEach((gs, i) => {
      const m = ghostBobs.current[i]
      tip2(gs, v3)
      if (m) m.position.copy(v3)
      if (!dragging.current && !params.paused) ghostTrails.current[i]?.push(v3.x, v3.y, -0.01 * (i + 1))
      spread = Math.max(spread, v3.distanceTo(v2))
    })

    frame.current++
    if (frame.current % 12 === 0) {
      const deg = (r: number) => `${((((r + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 180 / Math.PI - 180).toFixed(0)}°`
      setReadout({
        't': `${simTime.current.toFixed(1)}s`,
        'θ₁': deg(s[0]),
        'θ₂': deg(s[2]),
        'ghost spread': ghosts.current.length ? `${spread.toFixed(2)}m` : '—',
      })
    }
  })

  const bob2Color = pal.accent === pal.violet ? pal.pink : pal.violet
  const emissive = mode === 'light' ? 0.18 : 0.7
  const ghostList = Array.from({ length: Math.min(MAX_GHOSTS, params.ghosts) }, (_, i) => i)

  return (
    <group ref={groupRef}>
      {/* mount bracket */}
      <mesh position={[PIVOT.x, PIVOT.y + 0.16, -0.06]}>
        <boxGeometry args={[1.1, 0.08, 0.16]} />
        <meshStandardMaterial color={pal['line-bright']} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={PIVOT}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={pal.muted} metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh ref={rod1}>
        <cylinderGeometry args={[0.028, 0.028, 1, 12]} />
        <meshStandardMaterial color={pal['line-bright']} metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh ref={rod2}>
        <cylinderGeometry args={[0.024, 0.024, 1, 12]} />
        <meshStandardMaterial color={pal['line-bright']} metalness={0.75} roughness={0.3} />
      </mesh>

      <mesh
        ref={bob1}
        onPointerDown={beginDrag(1)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[0.17, 28, 28]} />
        <meshStandardMaterial color={pal.accent} emissive={pal.accent} emissiveIntensity={emissive} roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh
        ref={bob2}
        onPointerDown={beginDrag(2)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[0.15, 28, 28]} />
        <meshStandardMaterial color={bob2Color} emissive={bob2Color} emissiveIntensity={emissive} roughness={0.3} metalness={0.2} />
      </mesh>

      <Trail ref={mainTrail} length={900} color={bob2Color} fade={pal.bg} />

      {ghostList.map((i) => {
        const c = pal[GHOST_HUES[i % GHOST_HUES.length]]
        return (
          <group key={i}>
            <mesh ref={(m) => { ghostBobs.current[i] = m }}>
              <sphereGeometry args={[0.075, 14, 14]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={emissive * 0.6} transparent opacity={0.75} />
            </mesh>
            <Trail ref={(t) => { ghostTrails.current[i] = t }} length={520} color={c} fade={pal.bg} />
          </group>
        )
      })}
    </group>
  )
}
