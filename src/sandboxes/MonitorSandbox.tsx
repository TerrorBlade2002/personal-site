import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Live miniature of the VTA Grafana dashboard. Simulated calls emit latency
// samples, costs and dispositions; a P99 alert rule watches the histogram.
const DISPOSITIONS = ['verified', 'dnc', 'wrong_number', 'customer_wants_human', 'consumer_busy_end', 'other'] as const
const DISPO_WEIGHTS = [0.44, 0.06, 0.12, 0.14, 0.16, 0.08]
const DISPO_COLORS: Record<string, string> = {
  verified: 'var(--green)', dnc: 'var(--red)', wrong_number: 'var(--amber)',
  customer_wants_human: 'var(--violet)', consumer_busy_end: 'var(--accent)', other: 'var(--muted)',
}

function pickDispo() {
  let r = Math.random()
  for (let i = 0; i < DISPOSITIONS.length; i++) {
    r -= DISPO_WEIGHTS[i]
    if (r <= 0) return DISPOSITIONS[i]
  }
  return 'other'
}

const pct = (arr: number[], q: number) => {
  if (!arr.length) return 0
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}

export default function MonitorSandbox() {
  const touch = useSandboxTouch('monitor')
  const [running, setRunning] = useState(false)
  const [spike, setSpike] = useState(false)
  const [samples, setSamples] = useState<number[]>([])
  const [dispos, setDispos] = useState<Record<string, number>>({})
  const [cost, setCost] = useState(0)
  const [calls, setCalls] = useState(0)
  const [active, setActive] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const spikeRef = useRef(spike)
  spikeRef.current = spike

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      // each tick ≈ one call completing
      const base = 0.9 + Math.random() * 0.9
      const e2e = spikeRef.current ? base + 2.2 + Math.random() * 2.5 : base + (Math.random() < 0.06 ? 1.8 : 0)
      const d = pickDispo()
      const callCost = 0.04 + Math.random() * 0.075
      setSamples((s) => [...s.slice(-119), e2e])
      setDispos((m) => ({ ...m, [d]: (m[d] ?? 0) + 1 }))
      setCost((c) => c + callCost)
      setCalls((c) => c + 1)
      setActive(1 + Math.floor(Math.random() * 4))
      setLog((l) => [`call ended · ${d} · e2e ${e2e.toFixed(2)}s · $${callCost.toFixed(3)}`, ...l.slice(0, 9)])
    }, 700)
    return () => clearInterval(iv)
  }, [running])

  const p50 = pct(samples, 0.5)
  const p90 = pct(samples, 0.9)
  const p99 = pct(samples, 0.99)
  const alertFiring = samples.length > 8 && p99 > 4
  const maxDispo = Math.max(1, ...Object.values(dispos))

  return (
    <SandboxShell
      id="monitor"
      title="vta-emma — voice agent observability (mini-grafana)"
      note="the real stack is prometheus_client → remote_write → Grafana Cloud with 25+ series, Loki transcripts and 6 traffic-gated alert rules. This miniature keeps the shapes: latency histograms, cost counters, dispositions and the P99>4s critical alert."
    >
      <div className="sb-row" style={{ marginBottom: 14 }}>
        <button className="btn small" onClick={() => { touch(); setRunning(!running) }}>
          {running ? '⏸ stop traffic' : '▶ start call traffic'}
        </button>
        <button className="btn small ghost" onClick={() => { touch(); setSpike(!spike) }} disabled={!running}>
          {spike ? '🩹 heal the LLM' : '💥 inject LLM latency spike'}
        </button>
        <span className="mono-note">active sessions: {running ? active : 0} · calls: {calls} · est. cost ${cost.toFixed(2)}</span>
      </div>

      {alertFiring && (
        <div style={{ border: '1px solid var(--red)', background: 'rgba(248,113,113,0.1)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12.5 }}>
          <b style={{ color: 'var(--red)' }}>🔥 FIRING · HighE2ELatencyP99</b> — p99 end-to-end latency {p99.toFixed(2)}s &gt; 4s. Severity: critical. (In production this pages via Alertmanager.)
        </div>
      )}

      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">livekit_e2e_latency_seconds (last {samples.length} calls)</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 8px', background: 'var(--log-bg)' }}>
            {samples.slice(-60).map((v, i) => (
              <span key={i} style={{ flex: 1, height: `${Math.min(100, (v / 6) * 100)}%`, background: v > 4 ? 'var(--red)' : v > 2.5 ? 'var(--amber)' : 'var(--accent)', borderRadius: 1 }} />
            ))}
            {samples.length === 0 && <span className="t-sys" style={{ fontSize: 12 }}>no traffic — counters start at zero, that’s expected</span>}
          </div>
          <div className="metrics" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="metric"><div className="v" style={{ fontSize: 17 }}>{p50.toFixed(2)}s</div><div className="l">e2e p50</div></div>
            <div className="metric"><div className="v" style={{ fontSize: 17, color: p90 > 2.5 ? 'var(--amber)' : undefined }}>{p90.toFixed(2)}s</div><div className="l">e2e p90 (warn &gt;2.5)</div></div>
            <div className="metric"><div className="v" style={{ fontSize: 17, color: p99 > 4 ? 'var(--red)' : undefined }}>{p99.toFixed(2)}s</div><div className="l">e2e p99 (crit &gt;4)</div></div>
          </div>
          <span className="sb-label">sessions ended by disposition</span>
          {DISPOSITIONS.map((d) => (
            <div className="hbar" key={d}>
              <span className="name">{d}</span>
              <span className="track"><i className="fill" style={{ width: `${((dispos[d] ?? 0) / maxDispo) * 100}%`, background: DISPO_COLORS[d] }} /></span>
              <span className="val">{dispos[d] ?? 0}</span>
            </div>
          ))}
        </div>
        <div className="sb-col">
          <span className="sb-label">loki · call_summary stream</span>
          <div className="sb-log" style={{ minHeight: 280 }}>
            {log.length === 0 && <span className="t-sys">{'{agent="vta-emma", kind="call_summary"} | json — waiting for traffic…'}</span>}
            {log.map((l, i) => <span key={i} className={l.includes('verified') ? 't-ok' : 't-sys'}>{l}</span>)}
          </div>
          <div className="mono-note">the agent autoscales to zero — in production these metrics arrive via remote_write pushes, because there is nothing to scrape when it sleeps.</div>
        </div>
      </div>
    </SandboxShell>
  )
}
