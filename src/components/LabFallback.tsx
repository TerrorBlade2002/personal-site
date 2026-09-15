import { useMemo } from 'react'

// Static hero for visitors who can't run the WebGL scene (no context
// available, or prefers-reduced-motion). It integrates the same double
// pendulum with the same RK4 scheme as src/three/DoublePendulum.tsx and draws
// the resulting trace as an SVG polyline — no canvas, no animation, no WebGL.

const L1 = 1.15
const L2 = 1.05
const M1 = 1
const M2 = 1
const G = 9.81
const DT = 1 / 240

type State = [number, number, number, number] // θ1, ω1, θ2, ω2

function deriv(s: State, out: State) {
  const [t1, w1, t2, w2] = s
  const d = t1 - t2
  const sd = Math.sin(d)
  const cd = Math.cos(d)
  const den = 2 * M1 + M2 - M2 * Math.cos(2 * d)
  out[0] = w1
  out[1] = (-G * (2 * M1 + M2) * Math.sin(t1) - M2 * G * Math.sin(t1 - 2 * t2)
    - 2 * sd * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * cd)) / (L1 * den)
  out[2] = w2
  out[3] = (2 * sd * (w1 * w1 * L1 * (M1 + M2) + G * (M1 + M2) * Math.cos(t1) + w2 * w2 * L2 * M2 * cd)) / (L2 * den)
}

function simulate(th1: number, th2: number, seconds: number, sampleEvery: number) {
  const s: State = [th1, 0, th2, 0]
  const k1: State = [0, 0, 0, 0]
  const k2: State = [0, 0, 0, 0]
  const k3: State = [0, 0, 0, 0]
  const k4: State = [0, 0, 0, 0]
  const tmp: State = [0, 0, 0, 0]
  const pts: string[] = []
  const steps = Math.round(seconds / DT)
  for (let i = 0; i < steps; i++) {
    deriv(s, k1)
    for (let j = 0; j < 4; j++) tmp[j] = s[j] + (DT / 2) * k1[j]
    deriv(tmp, k2)
    for (let j = 0; j < 4; j++) tmp[j] = s[j] + (DT / 2) * k2[j]
    deriv(tmp, k3)
    for (let j = 0; j < 4; j++) tmp[j] = s[j] + DT * k3[j]
    deriv(tmp, k4)
    for (let j = 0; j < 4; j++) s[j] += (DT / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j])
    if (i % sampleEvery === 0) {
      const x = L1 * Math.sin(s[0]) + L2 * Math.sin(s[2])
      const y = -(-L1 * Math.cos(s[0]) - L2 * Math.cos(s[2])) // SVG y grows downward
      pts.push(`${x.toFixed(3)},${y.toFixed(3)}`)
    }
  }
  const x1 = L1 * Math.sin(s[0])
  const y1 = L1 * Math.cos(s[0])
  const x2 = x1 + L2 * Math.sin(s[2])
  const y2 = y1 + L2 * Math.cos(s[2])
  return { points: pts.join(' '), bob1: [x1, y1] as const, bob2: [x2, y2] as const }
}

export default function LabFallback() {
  const runs = useMemo(() => [
    { ...simulate(2.35, 2.0, 11, 4), color: 'var(--accent)', width: 0.022, opacity: 0.95 },
    { ...simulate(2.351, 2.0, 11, 4), color: 'var(--violet)', width: 0.016, opacity: 0.6 },
    { ...simulate(2.349, 2.0, 11, 4), color: 'var(--green)', width: 0.016, opacity: 0.45 },
  ], [])
  const main = runs[0]

  return (
    <div className="hero-fallback" data-testid="lab-fallback" aria-hidden="true">
      <svg viewBox="-2.5 -2.6 5 5.2" role="img" aria-label="Double pendulum trace">
        {runs.map((r, i) => (
          <polyline
            key={i}
            points={r.points}
            fill="none"
            stroke={r.color}
            strokeWidth={r.width}
            strokeOpacity={r.opacity}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        <line x1="0" y1="0" x2={main.bob1[0]} y2={main.bob1[1]} stroke="var(--line-bright)" strokeWidth="0.045" strokeLinecap="round" />
        <line x1={main.bob1[0]} y1={main.bob1[1]} x2={main.bob2[0]} y2={main.bob2[1]} stroke="var(--line-bright)" strokeWidth="0.04" strokeLinecap="round" />
        <circle cx="0" cy="0" r="0.07" fill="var(--muted)" />
        <circle cx={main.bob1[0]} cy={main.bob1[1]} r="0.15" fill="var(--accent)" />
        <circle cx={main.bob2[0]} cy={main.bob2[1]} r="0.13" fill="var(--violet)" />
      </svg>
    </div>
  )
}
