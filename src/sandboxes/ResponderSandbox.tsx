import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// The pure policy engine, playable: (state, event) → action, no I/O.
type LeadState = 'NEW' | 'STAGE1_SENT' | 'AWAITING_FOLLOWUP' | 'FOLLOWUP_SENT' | 'HUMAN_HANDOFF' | 'COMPLETE' | 'STOPPED'

const REPLIES = [
  { id: 'interested', label: '✨ “Interested, share details!”', cls: 'interested_no_details' },
  { id: 'full', label: '📦 “Here’s my WhatsApp + address”', cls: 'full_details' },
  { id: 'partial', label: '🤏 “My WhatsApp is +62…” (no address)', cls: 'partial_details' },
  { id: 'question', label: '❓ “What commission rate?”', cls: 'clarification_question' },
  { id: 'negative', label: '🙅 “Not interested, thanks”', cls: 'not_interested' },
]

export default function ResponderSandbox() {
  const touch = useSandboxTouch('responder')
  const [state, setState] = useState<LeadState>('NEW')
  const [log, setLog] = useState<string[]>([])
  const [day, setDay] = useState(0)
  const [funnel, setFunnel] = useState({ stage1: 0, followups: 0, handoffs: 0, complete: 0 })

  const push = (...lines: string[]) => setLog((l) => [...l, ...lines])

  const reset = () => { touch(); setState('NEW'); setLog([]); setDay(0) }

  const inject = (r: typeof REPLIES[number]) => {
    touch()
    if (state === 'HUMAN_HANDOFF' || state === 'COMPLETE' || state === 'STOPPED') {
      push(`✋ engine: lead already terminal (${state}) — a human owns it now. Reset to replay.`)
      return
    }
    push(`📥 inbound reply (day ${day}): classified as ${r.cls} · deduped on UNIQUE(mailbox,msg_id)`)
    if (r.cls === 'interested_no_details' && state === 'NEW') {
      push('⚙ decide(NEW, interested_no_details) → SEND_STAGE1 · recorded in outbox → relayed to Gmail')
      setState('STAGE1_SENT')
      setFunnel((f) => ({ ...f, stage1: f.stage1 + 1 }))
      push('⏲ scheduler: follow-up job enqueued, due in 1 day')
      setState('AWAITING_FOLLOWUP')
    } else if (r.cls === 'full_details') {
      push('⚙ decide(*, full_details) → COMPLETE · contacts extracted (regex+LLM) · CRM sync queued ✓')
      setState('COMPLETE')
      setFunnel((f) => ({ ...f, complete: f.complete + 1 }))
    } else if (r.cls === 'partial_details' || r.cls === 'clarification_question') {
      push(`⚙ decide(*, ${r.cls}) → HUMAN_HANDOFF · policy: any ambiguity goes to a person, not a template`)
      setState('HUMAN_HANDOFF')
      setFunnel((f) => ({ ...f, handoffs: f.handoffs + 1 }))
    } else {
      push('⚙ decide(*, not_interested) → STOP(stop_reason="declined") · lead closed politely, no more sends')
      setState('STOPPED')
    }
  }

  const advanceClock = () => {
    touch()
    const d = day + 1
    setDay(d)
    push(`🕐 debug/advance-clock +1 day (now day ${d})`)
    if (state === 'AWAITING_FOLLOWUP') {
      push('⏲ scheduler sweep (FOR UPDATE SKIP LOCKED): follow-up due → sending the ONE allowed follow-up')
      setState('FOLLOWUP_SENT')
      setFunnel((f) => ({ ...f, followups: f.followups + 1 }))
      push('⚙ decide(FOLLOWUP_SENT, timeout) → wait for reply; another silence will STOP, never spam')
    } else if (state === 'FOLLOWUP_SENT') {
      push('⚙ decide(FOLLOWUP_SENT, silence) → STOP(stop_reason="no_response_after_followup") · cadence exhausted')
      setState('STOPPED')
    } else {
      push('… nothing due. The engine does nothing unless policy says so.')
    }
  }

  return (
    <SandboxShell
      id="responder"
      title="mosaic-autoresponder — drive the policy engine"
      note="this is the actual decision table of the production engine (send stage-1 once, one follow-up after 1 day, hand off on anything ambiguous), minus Gmail, Postgres and Pub/Sub. The real 1-day wait is compressed into the clock button — same trick the fake-driven test harness uses."
    >
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">lead state: <b style={{ color: 'var(--accent)' }}>{state}</b> · clock: day {day}</span>
          <div className="sb-row">
            {REPLIES.map((r) => <button key={r.id} className="chip" onClick={() => inject(r)}>{r.label}</button>)}
          </div>
          <div className="sb-row">
            <button className="btn small ghost" onClick={advanceClock}>🕐 advance clock +1 day</button>
            <button className="btn small ghost" onClick={reset}>↺ new lead</button>
          </div>
          <span className="sb-label" style={{ marginTop: 8 }}>funnel (this session)</span>
          <div className="sb-kv"><span>stage-1 sent</span><b>{funnel.stage1}</b></div>
          <div className="sb-kv"><span>follow-ups sent</span><b>{funnel.followups}</b></div>
          <div className="sb-kv"><span>human handoffs</span><b>{funnel.handoffs}</b></div>
          <div className="sb-kv"><span>completed (full details)</span><b>{funnel.complete}</b></div>
        </div>
        <div className="sb-col">
          <span className="sb-label">lead_events timeline</span>
          <div className="sb-log" style={{ minHeight: 280 }}>
            {log.length === 0 && <span className="t-sys">a fresh lead just replied to your outreach. Inject their reply →</span>}
            {log.map((l, i) => <span key={i} className={l.startsWith('⚙') ? 't-agent' : l.startsWith('📥') ? 't-user' : 't-sys'}>{l}</span>)}
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
