import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// The whiteboard model of Kafka, animated: an append-only log, two consumers
// with independent offsets, and visible lag when one is slow.
const ITEMS = ['🍕 pizza', '🍜 ramen', '🌮 tacos', '🍔 burger', '🍣 sushi', '☕ coffee']
const USERS = ['maya', 'dev', 'ana', 'kirill', 'zoe']

type Msg = { offset: number; text: string }

export default function KafkaSandbox() {
  const touch = useSandboxTouch('kafka')
  const [log, setLog] = useState<Msg[]>([])
  const [auto, setAuto] = useState(false)
  const [offsetA, setOffsetA] = useState(0)
  const [offsetB, setOffsetB] = useState(0)
  const [consumed, setConsumed] = useState<{ who: string; text: string }[]>([])
  const seq = useRef(0)

  const produce = () => {
    touch()
    const text = `order_id=${1000 + seq.current} user=${USERS[Math.floor(Math.random() * USERS.length)]} item=${ITEMS[Math.floor(Math.random() * ITEMS.length)]} qty=${1 + Math.floor(Math.random() * 3)}`
    setLog((l) => [...l.slice(-29), { offset: seq.current++, text }])
  }

  useEffect(() => {
    if (!auto) return
    const iv = setInterval(produce, 800)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto])

  // consumer A: fast poller; consumer B: slow poller → visible lag
  useEffect(() => {
    const a = setInterval(() => {
      setOffsetA((o) => {
        const next = log.find((m) => m.offset >= o)
        if (!next) return o
        setConsumed((c) => [{ who: 'tracker-A (fast)', text: next.text }, ...c.slice(0, 9)])
        return next.offset + 1
      })
    }, 600)
    const b = setInterval(() => {
      setOffsetB((o) => {
        const next = log.find((m) => m.offset >= o)
        if (!next) return o
        setConsumed((c) => [{ who: 'tracker-B (slow)', text: next.text }, ...c.slice(0, 9)])
        return next.offset + 1
      })
    }, 2100)
    return () => { clearInterval(a); clearInterval(b) }
  }, [log])

  const lagA = Math.max(0, seq.current - offsetA)
  const lagB = Math.max(0, seq.current - offsetB)

  return (
    <SandboxShell
      id="kafka"
      title="orders-topic — the append-only log, live"
      note="the real project runs a single-node KRaft-mode broker in Docker with confluent-kafka producers/consumers. The mental model here is exact: an ordered immutable log, independent consumer offsets, and lag = head − offset."
    >
      <div className="sb-row" style={{ marginBottom: 12 }}>
        <button className="btn small" onClick={produce}>➤ produce one order</button>
        <button className="btn small ghost" onClick={() => { touch(); setAuto(!auto) }}>{auto ? '⏸ stop producer loop' : '▶ producer loop'}</button>
        <span className="mono-note">head offset: {seq.current}</span>
      </div>
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">topic: orders (append-only)</span>
          <div className="sb-log" style={{ minHeight: 230 }}>
            {log.length === 0 && <span className="t-sys">empty log — produce something. Offsets are forever.</span>}
            {[...log].reverse().map((m) => (
              <span key={m.offset} className="t-sys">
                <span className="t-acc">[{m.offset}]</span> {m.text}
                {m.offset >= offsetA && <span className="t-amb"> ◄A</span>}
                {m.offset >= offsetB && <span className="t-vio"> ◄B</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="sb-col">
          <span className="sb-label">consumer group status</span>
          <div className="sb-kv"><span>tracker-A (polls 0.6s)</span><b>offset {offsetA} · lag <span style={{ color: lagA > 3 ? 'var(--amber)' : 'var(--green)' }}>{lagA}</span></b></div>
          <div className="sb-kv"><span>tracker-B (polls 2.1s)</span><b>offset {offsetB} · lag <span style={{ color: lagB > 3 ? 'var(--red)' : 'var(--green)' }}>{lagB}</span></b></div>
          <span className="sb-label" style={{ marginTop: 8 }}>consumed events</span>
          <div className="sb-log" style={{ minHeight: 150 }}>
            {consumed.length === 0 && <span className="t-sys">consumers are polling…</span>}
            {consumed.map((c, i) => (
              <span key={i} className={c.who.includes('A') ? 't-amb' : 't-vio'}>{c.who} ← {c.text}</span>
            ))}
          </div>
          <div className="mono-note">Run the producer loop and watch tracker-B’s lag grow.</div>
        </div>
      </div>
    </SandboxShell>
  )
}
