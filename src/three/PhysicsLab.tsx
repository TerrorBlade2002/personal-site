import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Grid, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useLab, type Experiment } from '../store/labStore'
import { useApp } from '../store/appStore'
import { usePalette } from './usePalette'
import DoublePendulum from './DoublePendulum'
import DoubleSlit from './DoubleSlit'

// Camera presets per experiment (the experiment always sits at the origin).
const PRESETS: Record<Experiment, { pos: THREE.Vector3; target: THREE.Vector3; az: [number, number] }> = {
  pendulum: {
    pos: new THREE.Vector3(0.3, 1.2, 7.2),
    target: new THREE.Vector3(0, 0.75, 0),
    az: [-1.1, 1.1],
  },
  slits: {
    pos: new THREE.Vector3(-1.0, 4.9, -7.6),
    target: new THREE.Vector3(0, -0.5, 1.3),
    az: [Math.PI - 1.1, Math.PI + 1.1],
  },
}

// Responsive layout, derived from the live canvas size. Wide: the hero copy
// owns the left ~45%, so the scene shifts right. Narrow: the copy sits at the
// bottom, so the scene shifts up and the camera backs off.
function useLayout() {
  const size = useThree((s) => s.size)
  const wide = size.width >= 900
  return {
    wide,
    shiftX: wide ? Math.round(size.width * 0.36) : 0,
    shiftY: wide ? 0 : Math.round(size.height * 0.5),
    zoom: wide ? 1 : 1.5,
  }
}

// Asymmetric frustum: render a sub-rectangle of a larger virtual frame so the
// orbit-centred experiment is drawn off-centre without moving the camera.
function ViewOffset() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const { shiftX, shiftY } = useLayout()
  useEffect(() => {
    const fullW = size.width + shiftX
    const fullH = size.height + shiftY
    camera.aspect = fullW / fullH
    if (shiftX > 0 || shiftY > 0) camera.setViewOffset(fullW, fullH, 0, shiftY, size.width, size.height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }, [camera, size, shiftX, shiftY])
  return null
}

function Rig({ experiment, controlsRef }: { experiment: Experiment; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera)
  const { zoom } = useLayout()
  const settling = useRef(true)
  const goal = useRef({ pos: new THREE.Vector3(), target: new THREE.Vector3(), az: [0, 0] as [number, number] })

  useEffect(() => {
    const p = PRESETS[experiment]
    goal.current = {
      pos: p.target.clone().add(p.pos.clone().sub(p.target).multiplyScalar(zoom)),
      target: p.target.clone(),
      az: p.az,
    }
    settling.current = true
    const c = controlsRef.current
    if (c) { c.minAzimuthAngle = -Infinity; c.maxAzimuthAngle = Infinity }
  }, [experiment, zoom, controlsRef])

  useFrame((_, delta) => {
    if (!settling.current) return
    const c = controlsRef.current
    const { pos, target, az } = goal.current
    const a = 1 - Math.exp(-4.5 * delta)
    camera.position.lerp(pos, a)
    if (c) c.target.lerp(target, a)
    if (camera.position.distanceTo(pos) < 0.02 && (!c || c.target.distanceTo(target) < 0.02)) {
      settling.current = false
      if (c) { c.minAzimuthAngle = az[0]; c.maxAzimuthAngle = az[1] }
    }
  })
  return null
}

export default function PhysicsLab() {
  const pal = usePalette()
  const mode = useApp((s) => s.mode)
  const experiment = useLab((s) => s.experiment)
  const controls = useRef<OrbitControlsImpl | null>(null)
  const light = mode === 'light'

  // R3F's own wrapper is inline `position: relative; height: 100%`, so the
  // absolutely-positioned box has to be ours.
  return (
    <div className="hero-canvas">
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0.3, 1.2, 7.2], fov: 45, near: 0.1, far: 80, manual: true }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping }}
    >
      <ViewOffset />
      <color attach="background" args={[pal.bg]} />
      <fog attach="fog" args={[pal.bg, 18, 40]} />
      <ambientLight intensity={light ? 1.4 : 0.75} />
      <directionalLight position={[4, 9, 6]} intensity={light ? 2.4 : 1.7} />
      <pointLight position={[-6, 3, -4]} intensity={light ? 10 : 45} color={pal.accent} />
      {!light && <Stars radius={70} depth={40} count={2200} factor={3} saturation={0} fade speed={0.5} />}
      <Grid
        position={[0, -2.75, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={pal['grid-minor']}
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor={pal['grid-major']}
        fadeDistance={30}
        fadeStrength={1.4}
        infiniteGrid
      />
      {experiment === 'pendulum'
        ? <DoublePendulum pal={pal} controlsRef={controls} />
        : <group scale={0.8}><DoubleSlit pal={pal} /></group>}
      <Rig experiment={experiment} controlsRef={controls} />
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.45}
        minPolarAngle={0.35}
        maxPolarAngle={1.75}
      />
    </Canvas>
    </div>
  )
}
