import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Shared engine for both usage-tracker sandboxes: a simulated fleet of agents
// emits events; the dashboard aggregates; CSV export downloads a real file.
type Cfg = {
  id: string
  title: string
  entityLabel: string   // "Custom GPT" / "notebook"
  entities: string[]
  users: string[]
  note: string
}

type Ev = { user: string; entity: string; turn: number; at: string }

export default function TrackerCore({ cfg }: { cfg: Cfg }) {
  const touch = useSandboxTouch(cfg.id)
  const [running, setRunning] = useState(false)
  const [events, setEvents] = useState<Ev[]>([])
  const turnsRef = useRef<Record<string, number>>({})

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      const user = cfg.users[Math.floor(Math.random() * cfg.users.length)]
      const entity = cfg.entities[Math.floor(Math.random() * cfg.entities.length)]
      const key = `${user}|${entity}`
      turnsRef.current[key] = (turnsRef.current[key] ?? 0) + 1
      const ev: Ev = { user, entity, turn: turnsRef.current[key], at: new Date().toLocaleTimeString() }
      setEvents((e) => [ev, ...e.slice(0, 199)])
    }, 500)
    return () => clearInterval(iv)
  }, [running, cfg])

  const byEntity: Record<string, number> = {}
  const byUser: Record<string, number> = {}
  events.forEach((e) => {
    byEntity[e.entity] = (byEntity[e.entity] ?? 0) + 1
    byUser[e.user] = (byUser[e.user] ?? 0) + 1
  })
  const topEntities = Object.entries(byEntity).sort((a, b) => b[1] - a[1])
  const maxE = Math.max(1, ...topEntities.map(([, n]) => n))
  const activeUsers = Object.keys(byUser).length

  const exportCsv = () => {
    touch()
    const rows = [['system_username', cfg.entityLabel.replace(' ', '_').toLowerCase(), 'turn_number', 'captured_at'],
      ...events.map((e) => [e.user, e.entity, String(e.turn), e.at])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${cfg.id}-usage-report.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <SandboxShell
      id={cfg.id}
      title={cfg.title}
      note={cfg.note}
    >
      <div className="sb-row" style={{ marginBottom: 14 }}>
        <button className="btn small" onClick={() => { touch(); setRunning(!running) }}>
          {running ? '⏸ pause fleet' : '▶ simulate the fleet'}
        </button>
        <button className="btn small ghost" onClick={exportCsv} disabled={events.length === 0}>⭳ export CSV report</button>
        <span className="mono-note">{events.length} events · {activeUsers} active users</span>
      </div>
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">turns per {cfg.entityLabel}</span>
          {topEntities.length === 0 && <span className="t-sys" style={{ fontSize: 12.5 }}>no telemetry yet — start the fleet.</span>}
          {topEntities.map(([name, n]) => (
            <div className="hbar" key={name}>
              <span className="name">{name}</span>
              <span className="track"><i className="fill" style={{ width: `${(n / maxE) * 100}%` }} /></span>
              <span className="val">{n}</span>
            </div>
          ))}
          {events.length > 0 && (
            <>
              <span className="sb-label" style={{ marginTop: 10 }}>power users</span>
              {Object.entries(byUser).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([u, n]) => (
                <div className="sb-kv" key={u}><span>{u}</span><b>{n} turns</b></div>
              ))}
            </>
          )}
        </div>
        <div className="sb-col">
          <span className="sb-label">live event stream (native-host attributed)</span>
          <div className="sb-log" style={{ minHeight: 260 }}>
            {events.length === 0 && <span className="t-sys">POST /api/events — waiting for the extension retry queues to flush…</span>}
            {events.slice(0, 14).map((e, i) => (
              <span key={i} className="t-sys">
                [{e.at}] <span className="t-amb">{e.user}</span> → <span className="t-agent">{e.entity}</span> turn #{e.turn}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
