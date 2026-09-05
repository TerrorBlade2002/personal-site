import { useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Mini call auditor: run the "judge" over a sample transcript. The core rule
// survives the miniaturization: a FAIL without a verbatim quote is impossible.
const TRANSCRIPT = [
  { t: '00:02', who: 'agent', text: 'Hi, this is Marcus calling from Everest Recovery Services on a recorded line.' },
  { t: '00:09', who: 'agent', text: 'This is an attempt to collect a debt and any information obtained will be used for that purpose.' },
  { t: '00:17', who: 'customer', text: 'I already told you people, I lost my job last month.' },
  { t: '00:24', who: 'agent', text: 'I hear you, that sounds really stressful. Let’s see what options fit your situation.' },
  { t: '00:31', who: 'agent', text: 'If you can’t pay today we could look at a hardship plan of $25 a month.' },
  { t: '00:39', who: 'customer', text: 'What happens if I just don’t pay anything?' },
  { t: '00:44', who: 'agent', text: 'Then this stays unresolved and keeps accruing — I’d hate to see that for you.' },
]

type Item = { id: string; rule: string; verdict: 'PASS' | 'FAIL' | 'NA'; quote?: string; ts?: string; note: string }

const ITEMS: Item[] = [
  { id: 'ident', rule: 'Agent identifies self + company', verdict: 'PASS', quote: 'this is Marcus calling from Everest Recovery Services', ts: '00:02', note: 'clear identification within first 10s' },
  { id: 'miranda', rule: 'Mini-Miranda disclosure given', verdict: 'PASS', quote: 'attempt to collect a debt and any information obtained', ts: '00:09', note: 'verbatim disclosure present' },
  { id: 'empathy', rule: 'Empathy on hardship statement', verdict: 'PASS', quote: 'I hear you, that sounds really stressful', ts: '00:24', note: 'acknowledged before pivoting to options' },
  { id: 'options', rule: 'Offers a payment option', verdict: 'PASS', quote: 'hardship plan of $25 a month', ts: '00:31', note: 'concrete, affordable option offered' },
  { id: 'threat', rule: 'No threats / implied consequences', verdict: 'FAIL', quote: 'this stays unresolved and keeps accruing — I’d hate to see that', ts: '00:44', note: 'implied negative consequence without stating lawful specifics — FDCPA-sensitive' },
  { id: 'callback', rule: 'Offers callback number', verdict: 'NA', note: 'no quote found in transcript → cannot FAIL. Marked NA per the evidence rule.' },
]

export default function AuditSandbox() {
  const touch = useSandboxTouch('audit')
  const [revealed, setRevealed] = useState(0)
  const [running, setRunning] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const run = () => {
    touch()
    timers.current.forEach(clearTimeout)
    setRevealed(0)
    setRunning(true)
    ITEMS.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        setRevealed(i + 1)
        if (i === ITEMS.length - 1) setRunning(false)
      }, 600 * (i + 1)))
    })
  }

  const fails = ITEMS.slice(0, revealed).filter((i) => i.verdict === 'FAIL').length

  return (
    <SandboxShell
      id="audit"
      title="everest-auditor — judge a collection call"
      note="production judges every call multimodally (Gemini hears the audio and reads the diarized transcript) behind a durable Postgres queue with rate shaping and a CI eval gate. This miniature keeps the sacred rule: no verbatim quote, no FAIL."
    >
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">recording_1142.wav → diarized transcript</span>
          <div className="sb-log" style={{ minHeight: 240 }}>
            {TRANSCRIPT.map((l, i) => (
              <span key={i} className={l.who === 'agent' ? 't-agent' : 't-user'}>
                [{l.t}] {l.who === 'agent' ? '🎧 agent' : '👤 customer'}: {l.text}
              </span>
            ))}
          </div>
          <button className="btn small" onClick={run} disabled={running}>
            {running ? '⚖ judging…' : revealed ? '⚖ re-run the judge' : '⚖ run the judge'}
          </button>
        </div>
        <div className="sb-col">
          <span className="sb-label">checklist verdicts {revealed > 0 && `· ${fails} FAIL`}</span>
          <div className="sb-col" style={{ gap: 8 }}>
            {ITEMS.slice(0, revealed).map((it) => (
              <div key={it.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', background: 'var(--panel)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                  <span className={`verdict ${it.verdict.toLowerCase()}`}>{it.verdict}</span>
                  <b style={{ fontWeight: 500 }}>{it.rule}</b>
                </div>
                {it.quote && <div className="mono-note" style={{ marginTop: 4 }}>evidence [{it.ts}]: “{it.quote}”</div>}
                <div className="mono-note" style={{ color: it.verdict === 'FAIL' ? 'var(--red)' : undefined }}>{it.note}</div>
              </div>
            ))}
            {revealed === 0 && <span className="t-sys" style={{ fontSize: 12.5 }}>verdicts appear here — each PASS/FAIL must point at a timestamped quote.</span>}
            {revealed === ITEMS.length && (
              <div className="mono-note">
                the “offers callback” item found no evidence — and therefore <b style={{ color: 'var(--green)' }}>cannot fail</b>. That’s the anti-bias design: the judge can’t invent flaws, and the coaching rewriter only diverges where a FAIL has cited evidence.
              </div>
            )}
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
