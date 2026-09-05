import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Walk a synthetic email through the licensing state machine. Human-gated
// transitions require an explicit click — exactly the production philosophy.
type Scenario = { id: string; label: string; from: string; subject: string; classification: string }

const SCENARIOS: Scenario[] = [
  { id: 'renewal', label: '📋 renewal notice', from: 'licensing@state-regulator.gov', subject: 'License #ML-2214 renewal window opens', classification: 'license_renewal (deterministic rule hit, confidence 0.98)' },
  { id: 'rfi', label: '❓ regulator question', from: 'examiner@nmls.example', subject: 'RFI: surety bond documentation', classification: 'information_request (rule miss → LLM enrichment, gated, confidence 0.81)' },
  { id: 'spam', label: '🎣 vendor spam', from: 'sales@compliance-tools.biz', subject: 'Revolutionize your licensing workflow!!!', classification: 'irrelevant (deterministic rule hit, confidence 0.99)' },
]

const FLOW = [
  { state: 'RECEIVED', human: false, log: (s: Scenario) => `Graph webhook: clientState verified (constant-time) · notification receipt stored · message ${s.id}-8842 fetched via delta sync` },
  { state: 'EVIDENCE_CAPTURED', human: false, log: () => 'full JSON + raw MIME persisted · 2 attachments saved, SHA-256 fingerprinted · job queued (leased)' },
  { state: 'CLASSIFIED', human: false, log: (s: Scenario) => `classification: ${s.classification}` },
  { state: 'IN_REVIEW', human: true, log: () => 'review claim taken in portal · fields corrected: license_id, due_date · audit event appended' },
  { state: 'RESPONSE_DRAFTED', human: false, log: () => 'controlled response plan → immutable draft revision r1 created · attachments governed' },
  { state: 'SEND_APPROVED', human: true, log: () => 'exact-snapshot approval: human approved draft r1 byte-for-byte · approval recorded in outbox' },
  { state: 'SENT + RECONCILED', human: false, log: () => 'durable send → Sent Items reconciliation matched · workflow atomically completed ✓' },
]

export default function AstraSandbox() {
  const touch = useSandboxTouch('astra')
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [step, setStep] = useState(0)
  const [audit, setAudit] = useState<string[]>([])

  const inject = (s: Scenario) => {
    touch()
    setScenario(s)
    setStep(0)
    setAudit([`▶ injected: "${s.subject}" from ${s.from}`])
  }

  const advance = () => {
    if (!scenario || step >= FLOW.length) return
    touch()
    const f = FLOW[step]
    if (scenario.id === 'spam' && f.state === 'IN_REVIEW') {
      setAudit((a) => [...a, `→ CLASSIFIED as irrelevant · auto-archived with audit trail · no human time spent ✓ (flow ends)`])
      setStep(FLOW.length)
      return
    }
    setAudit((a) => [...a, `→ ${f.state}: ${f.log(scenario)}`])
    setStep(step + 1)
  }

  const cur = FLOW[step]
  const finished = scenario && step >= FLOW.length

  return (
    <SandboxShell
      id="astra"
      title="astra-licensing — email state machine walkthrough"
      note="the real system spans 8 milestones, 11 worker queue families and a transactional outbox on PostgreSQL. States here are simplified labels for the real transitions — but the invariant is identical: no send without an exact-snapshot human approval, ever."
    >
      <div className="sb-row" style={{ marginBottom: 12 }}>
        <span className="sb-label" style={{ alignSelf: 'center' }}>inject a mailbox event:</span>
        {SCENARIOS.map((s) => (
          <button key={s.id} className={`chip ${scenario?.id === s.id ? 'on' : ''}`} onClick={() => inject(s)}>{s.label}</button>
        ))}
      </div>

      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">state machine</span>
          <div className="pipe">
            {FLOW.map((f, i) => (
              <div className="pipe-step" key={f.state}>
                <div className="pipe-num" style={{
                  borderColor: i < step ? 'var(--green)' : i === step && scenario ? 'var(--amber)' : 'var(--line-bright)',
                  color: i < step ? 'var(--green)' : i === step && scenario ? 'var(--amber)' : 'var(--muted)',
                }}>{i < step ? '✓' : i + 1}</div>
                <div className="pipe-body">
                  <b style={{ color: i === step && scenario && !finished ? 'var(--amber)' : undefined }}>
                    {f.state} {f.human && <span className="verdict na" style={{ marginLeft: 6 }}>HUMAN REQUIRED</span>}
                  </b>
                </div>
              </div>
            ))}
          </div>
          {scenario && !finished && (
            <button className="btn small" onClick={advance}>
              {cur?.human ? '🖊 act as the human reviewer' : '⚙ let the worker advance'}
            </button>
          )}
          {finished && <span className="t-ok" style={{ fontSize: 13 }}>■ workflow complete — every transition has an audit event. Inject another email.</span>}
        </div>
        <div className="sb-col">
          <span className="sb-label">audit_events (append-only)</span>
          <div className="sb-log" style={{ minHeight: 280 }}>
            {audit.length === 0 && <span className="t-sys">the audit log is empty. Inject an email to begin — nothing here ever gets deleted.</span>}
            {audit.map((l, i) => <span key={i} className={l.includes('✓') ? 't-ok' : 't-sys'}>{l}</span>)}
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
