import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLab } from '../store/labStore'
import type { Palette } from './usePalette'

// Ripple-tank rendering of Young's experiment. The tank surface is a plane
// displaced in the vertex shader by a plane wave (before the barrier) and the
// superposition of two cylindrical waves from the slits (after it). The far
// screen shows the analytic time-averaged intensity 2A²(1+cos kΔr) times the
// single-slit sinc² envelope — the textbook fringe pattern, computed per pixel.
const W = 9
const Z0 = -3.2   // source edge
const Z1 = 5.2    // screen
const SLIT_W = 0.32
const C = 1.35    // phase speed

const tankVert = /* glsl */`
  uniform float uTime, uK, uOmega, uAmp, uSep, uOpen1, uOpen2;
  varying float vH; varying float vShade; varying vec2 vUv;

  float wave(vec2 p) {                 // p = (x, worldZ)
    if (p.y < 0.0) {
      float env = smoothstep(${Z0.toFixed(1)}, ${(Z0 + 0.9).toFixed(1)}, p.y) * (1.0 - smoothstep(-0.35, 0.0, p.y));
      return uAmp * env * sin(uK * p.y - uOmega * uTime);
    }
    vec2 s1 = vec2(-uSep * 0.5, 0.0);
    vec2 s2 = vec2( uSep * 0.5, 0.0);
    float r1 = length(p - s1);
    float r2 = length(p - s2);
    float a1 = uOpen1 / sqrt(1.0 + 0.9 * r1);
    float a2 = uOpen2 / sqrt(1.0 + 0.9 * r2);
    float h = a1 * sin(uK * r1 - uOmega * uTime) + a2 * sin(uK * r2 - uOmega * uTime);
    float gate = smoothstep(0.0, 0.22, p.y);
    return uAmp * 0.95 * h * gate;
  }

  void main() {
    vUv = uv;
    vec2 p = vec2(position.x, -position.y);   // plane is rotated -90° about X: local y → world -z
    float e = 0.05;
    float h  = wave(p);
    float hx = wave(p + vec2(e, 0.0));
    float hz = wave(p + vec2(0.0, e));
    vec3 nWorld = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));
    vec3 light = normalize(vec3(-0.35, 1.0, -0.55));
    vShade = max(dot(nWorld, light), 0.0);
    vH = h;
    vec3 pos = position;
    pos.z += h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const tankFrag = /* glsl */`
  uniform vec3 uLow, uHigh, uLine; uniform float uAmp;
  varying float vH; varying float vShade; varying vec2 vUv;
  void main() {
    float t = smoothstep(-uAmp, uAmp, vH);
    vec3 col = mix(uLow, uHigh, t) * (0.62 + 0.55 * vShade);
    vec2 g = abs(fract(vUv * vec2(18.0, 16.8)) - 0.5);
    float line = 1.0 - smoothstep(0.455, 0.5, max(g.x, g.y));
    col = mix(col, uLine, line * 0.22);
    gl_FragColor = vec4(col, 1.0);
  }
`

const screenFrag = /* glsl */`
  uniform float uK, uSep, uOpen1, uOpen2, uL, uWidth, uSlitW;
  uniform vec3 uDark, uBright;
  varying vec2 vUv;
  void main() {
    float x = (vUv.x - 0.5) * uWidth;
    float r1 = length(vec2(x + uSep * 0.5, uL));
    float r2 = length(vec2(x - uSep * 0.5, uL));
    float a1 = uOpen1 / sqrt(1.0 + 0.9 * r1);
    float a2 = uOpen2 / sqrt(1.0 + 0.9 * r2);
    float I = a1 * a1 + a2 * a2 + 2.0 * a1 * a2 * cos(uK * (r1 - r2));
    float sinT = x / sqrt(x * x + uL * uL);
    float beta = 0.5 * uK * uSlitW * sinT;
    float env = abs(beta) < 1e-4 ? 1.0 : pow(sin(beta) / beta, 2.0);
    float a0 = 1.0 / sqrt(1.0 + 0.9 * uL);
    float norm = max((uOpen1 + uOpen2) * (uOpen1 + uOpen2) * a0 * a0, 0.02);
    I = clamp(I * env / norm, 0.0, 1.0);
    float vfade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    vec3 col = mix(uDark, uBright, pow(I, 0.8));
    gl_FragColor = vec4(col, 0.9 * vfade + 0.1);
  }
`

const screenVert = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`

export default function DoubleSlit({ pal }: { pal: Palette }) {
  const params = useLab((s) => s.slits)
  const setReadout = useLab((s) => s.setReadout)
  const t = useRef(0)
  const frame = useRef(0)

  const tankGeom = useMemo(() => new THREE.PlaneGeometry(W, Z1 - Z0, 180, 168), [])
  const tankMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: tankVert,
    fragmentShader: tankFrag,
    uniforms: {
      uTime: { value: 0 }, uK: { value: 1 }, uOmega: { value: 1 }, uAmp: { value: 0.14 },
      uSep: { value: 1.4 }, uOpen1: { value: 1 }, uOpen2: { value: 1 },
      uLow: { value: new THREE.Color('#000') }, uHigh: { value: new THREE.Color('#fff') }, uLine: { value: new THREE.Color('#888') },
    },
  }), [])
  const screenMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: screenVert,
    fragmentShader: screenFrag,
    transparent: true,
    side: THREE.DoubleSide,
    uniforms: {
      uK: { value: 1 }, uSep: { value: 1.4 }, uOpen1: { value: 1 }, uOpen2: { value: 1 },
      uL: { value: Z1 }, uWidth: { value: W }, uSlitW: { value: SLIT_W },
      uDark: { value: new THREE.Color('#000') }, uBright: { value: new THREE.Color('#fff') },
    },
  }), [])

  useEffect(() => {
    tankMat.uniforms.uLow.value.set(pal.panel)
    tankMat.uniforms.uHigh.value.set(pal.accent)
    tankMat.uniforms.uLine.value.set(pal['line-bright'])
    screenMat.uniforms.uDark.value.set(pal.bg2)
    screenMat.uniforms.uBright.value.set(pal.accent)
  }, [pal, tankMat, screenMat])

  useEffect(() => () => { tankGeom.dispose(); tankMat.dispose(); screenMat.dispose() }, [tankGeom, tankMat, screenMat])

  useFrame((_, delta) => {
    if (!params.paused) t.current += Math.min(delta, 0.05)
    const k = (2 * Math.PI) / params.wavelength
    const u = tankMat.uniforms
    u.uTime.value = t.current
    u.uK.value = k
    u.uOmega.value = k * C
    u.uSep.value = params.separation
    u.uOpen1.value = THREE.MathUtils.damp(u.uOpen1.value, params.slit1 ? 1 : 0, 8, delta)
    u.uOpen2.value = THREE.MathUtils.damp(u.uOpen2.value, params.slit2 ? 1 : 0, 8, delta)
    const su = screenMat.uniforms
    su.uK.value = k
    su.uSep.value = params.separation
    su.uOpen1.value = u.uOpen1.value
    su.uOpen2.value = u.uOpen2.value

    frame.current++
    if (frame.current % 15 === 0) {
      // fringe spacing on the screen: Δy = λL/d
      const spacing = (params.wavelength * Z1) / params.separation
      setReadout({
        'λ': `${params.wavelength.toFixed(2)}`,
        'd': `${params.separation.toFixed(2)}`,
        'fringe Δy': params.slit1 && params.slit2 ? `${spacing.toFixed(2)} (λL/d)` : 'none — single slit',
        'slits open': `${Number(params.slit1) + Number(params.slit2)}/2`,
      })
    }
  })

  // barrier segments with two gaps (plugged when a slit is closed)
  const half = W / 2
  const s1 = -params.separation / 2
  const s2 = params.separation / 2
  const segs: [number, number][] = [
    [-half, s1 - SLIT_W / 2],
    [s1 + SLIT_W / 2, s2 - SLIT_W / 2],
    [s2 + SLIT_W / 2, half],
  ]
  if (!params.slit1) segs.push([s1 - SLIT_W / 2, s1 + SLIT_W / 2])
  if (!params.slit2) segs.push([s2 - SLIT_W / 2, s2 + SLIT_W / 2])

  return (
    <group position={[0, -0.9, 0]}>
      {/* tank surface: local (x, y) → world (x, -z) after the rotation */}
      <mesh geometry={tankGeom} material={tankMat} rotation-x={-Math.PI / 2} position={[0, 0, (Z0 + Z1) / 2]} />

      {/* tank rim */}
      <mesh position={[0, -0.06, (Z0 + Z1) / 2]}>
        <boxGeometry args={[W + 0.3, 0.1, Z1 - Z0 + 0.3]} />
        <meshStandardMaterial color={pal.panel2} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* wave source */}
      <mesh position={[0, 0.08, Z0 + 0.05]}>
        <boxGeometry args={[W, 0.06, 0.08]} />
        <meshStandardMaterial color={pal.accent} emissive={pal.accent} emissiveIntensity={1.2} />
      </mesh>

      {/* barrier */}
      {segs.map(([a, b], i) => (
        <mesh key={i} position={[(a + b) / 2, 0.19, 0]}>
          <boxGeometry args={[Math.max(0.001, b - a), 0.42, 0.14]} />
          <meshStandardMaterial color={pal['line-bright']} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}

      {/* detection screen (faces the camera, which sits behind the source) */}
      <mesh position={[0, 0.85, Z1 + 0.02]} rotation-y={Math.PI} material={screenMat}>
        <planeGeometry args={[W, 1.5]} />
      </mesh>
      <mesh position={[0, 0.85, Z1 + 0.09]}>
        <boxGeometry args={[W + 0.2, 1.7, 0.06]} />
        <meshStandardMaterial color={pal.panel2} metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  )
}
