import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Miniature of the XGBoost pipeline: a hand-rolled logistic scorer whose
// feature weights mimic the real model's temporal/behavioral signals.
type Tx = { amount: number; hour: number; velocity: number; distance: number; merchant: number }

const WEIGHTS = { amount: 1.9, hour: 1.15, velocity: 2.3, distance: 1.5, merchant: 1.2, bias: -4.1 }

function featureVector(t: Tx) {
  return {
    amount: Math.min(1, t.amount / 5000),                       // big spends
    hour: t.hour >= 1 && t.hour <= 5 ? 1 : t.hour >= 23 ? 0.6 : 0.05, // dead-of-night
    velocity: Math.min(1, t.velocity / 12),                      // txns in last hour
    distance: Math.min(1, t.distance / 4000),                    // km from home
    merchant: t.merchant,                                        // category risk 0..1
  }
}

function score(t: Tx) {
  const f = featureVector(t)
  const contribs = {
    amount: f.amount * WEIGHTS.amount,
    hour: f.hour * WEIGHTS.hour,
    velocity: f.velocity * WEIGHTS.velocity,
    distance: f.distance * WEIGHTS.distance,
    merchant: f.merchant * WEIGHTS.merchant,
  }
  const z = Object.values(contribs).reduce((a, b) => a + b, WEIGHTS.bias)
  const p = 1 / (1 + Math.exp(-z))
  return { p, contribs }
}

const MERCHANTS = [
  { label: 'grocery store (low risk)', v: 0.05 },
  { label: 'electronics (medium)', v: 0.4 },
  { label: 'crypto exchange (high)', v: 0.85 },
  { label: 'gift cards (very high)', v: 1 },
]

const FEATURE_LABELS: Record<string, string> = {
  amount: 'amount', hour: 'time-of-day', velocity: 'txn velocity', distance: 'geo distance', merchant: 'merchant risk',
}

function randTx(): Tx {
  const fraudish = Math.random() < 0.25
  return fraudish
    ? { amount: 800 + Math.random() * 4200, hour: [1, 2, 3, 4][Math.floor(Math.random() * 4)], velocity: 4 + Math.floor(Math.random() * 9), distance: 500 + Math.random() * 3500, merchant: 0.6 + Math.random() * 0.4 }
    : { amount: 5 + Math.random() * 320, hour: 8 + Math.floor(Math.random() * 13), velocity: Math.floor(Math.random() * 3), distance: Math.random() * 40, merchant: Math.random() * 0.35 }
}

export default function FraudSandbox() {
  const touch = useSandboxTouch('fraud')
  const [tx, setTx] = useState<Tx>({ amount: 120, hour: 14, velocity: 1, distance: 8, merchant: 0.05 })
  const [stream, setStream] = useState(false)
  const [log, setLog] = useState<{ id: number; text: string; fraud: boolean }[]>([])
  const [caught, setCaught] = useState(0)
  const [seen, setSeen] = useState(0)
  const seqRef = useRef(1)

  const { p, contribs } = score(tx)
  const verdict = p > 0.5 ? 'FRAUD' : p > 0.25 ? 'REVIEW' : 'LEGIT'
  const vColor = p > 0.5 ? 'var(--red)' : p > 0.25 ? 'var(--amber)' : 'var(--green)'

  useEffect(() => {
    if (!stream) return
    const iv = setInterval(() => {
      const t = randTx()
      const s = score(t)
      const isFraud = s.p > 0.5
      setSeen((n) => n + 1)
      if (isFraud) setCaught((n) => n + 1)
      setLog((l) => [
        { id: seqRef.current++, fraud: isFraud, text: `$${t.amount.toFixed(0)} @ ${String(t.hour).padStart(2, '0')}:00 · ${t.velocity} tx/h · ${t.distance.toFixed(0)}km → p=${s.p.toFixed(2)} ${isFraud ? 'BLOCK' : 'pass'}` },
        ...l.slice(0, 11),
      ])
    }, 900)
    return () => clearInterval(iv)
  }, [stream])

  const set = (k: keyof Tx, v: number) => { touch(); setTx((t) => ({ ...t, [k]: v })) }

  return (
    <SandboxShell
      id="fraud"
      title="fraud-scorer — miniature of the Kafka→XGBoost loop"
      note="the real system streams from Confluent Kafka into an Airflow-orchestrated XGBoost model with MLflow tracking. This is a 5-feature logistic miniature with the same feature intuition — same shape, 1/1000th the machinery."
    >
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">craft a transaction</span>
          <label className="sb-kv"><span>amount: ${tx.amount.toFixed(0)}</span>
            <input type="range" min={5} max={5000} value={tx.amount} onChange={(e) => set('amount', +e.target.value)} /></label>
          <label className="sb-kv"><span>hour of day: {String(tx.hour).padStart(2, '0')}:00</span>
            <input type="range" min={0} max={23} value={tx.hour} onChange={(e) => set('hour', +e.target.value)} /></label>
          <label className="sb-kv"><span>txns in last hour: {tx.velocity}</span>
            <input type="range" min={0} max={15} value={tx.velocity} onChange={(e) => set('velocity', +e.target.value)} /></label>
          <label className="sb-kv"><span>km from home: {tx.distance.toFixed(0)}</span>
            <input type="range" min={0} max={4000} value={tx.distance} onChange={(e) => set('distance', +e.target.value)} /></label>
          <label className="sb-kv"><span>merchant</span>
            <select className="sb-select" value={tx.merchant} onChange={(e) => set('merchant', +e.target.value)}>
              {MERCHANTS.map((m) => <option key={m.label} value={m.v}>{m.label}</option>)}
            </select></label>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 8 }}>
            <span className="gauge-num" style={{ color: vColor }}>{(p * 100).toFixed(1)}%</span>
            <span className="verdict" style={{ color: vColor, borderColor: vColor, background: 'transparent', border: `1px solid ${vColor}`, fontSize: 13 }}>{verdict}</span>
          </div>
          <span className="sb-label">feature contributions (why the model thinks so)</span>
          {Object.entries(contribs).map(([k, v]) => (
            <div className="hbar" key={k}>
              <span className="name">{FEATURE_LABELS[k]}</span>
              <span className="track"><i className="fill" style={{ width: `${Math.min(100, (v / 2.4) * 100)}%`, background: v > 1 ? 'var(--red)' : v > 0.4 ? 'var(--amber)' : 'var(--green)' }} /></span>
              <span className="val">+{v.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="sb-col">
          <span className="sb-label">kafka stream mode</span>
          <div className="sb-row">
            <button className="btn small" onClick={() => { touch(); setStream(!stream) }}>
              {stream ? '⏸ pause stream' : '▶ consume orders topic'}
            </button>
            <span className="mono-note">{seen} scored · {caught} blocked</span>
          </div>
          <div className="sb-log" style={{ minHeight: 260 }}>
            {log.length === 0 && <span className="t-sys">stream idle — press play to consume synthetic transactions…</span>}
            {log.map((l) => (
              <span key={l.id} className={l.fraud ? 't-err' : 't-ok'}>{l.fraud ? '✖ ' : '✓ '}{l.text}</span>
            ))}
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
