import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Scripted miniature of a VTA verification call. Each persona exercises a
// different branch of the real flow (and logs the same dispositions).
type Turn = { role: 'agent' | 'user' | 'sys'; text: string; ms?: number }
type Persona = { id: string; label: string; disposition: string; turns: Turn[] }

const OPENING = 'Hi, this is Emma calling from account services on a recorded line. Am I speaking with Jane Smith?'

const PERSONAS: Persona[] = [
  {
    id: 'cooperative', label: '😊 cooperative caller', disposition: 'verified',
    turns: [
      { role: 'agent', text: OPENING, ms: 980 },
      { role: 'user', text: 'Yes, this is Jane.' },
      { role: 'agent', text: 'Thanks Jane. For verification, could you confirm the last two digits of your SSN on file?', ms: 1140 },
      { role: 'user', text: 'Sure, it’s 42.' },
      { role: 'sys', text: 'tool_call → log_verification(status="verified")' },
      { role: 'agent', text: 'Perfect, you’re verified. Connecting you with a specialist now — one moment.', ms: 890 },
      { role: 'sys', text: 'SIP participant removed with clean BYE → TCN Action OK → hunt group' },
    ],
  },
  {
    id: 'wrong', label: '🤨 wrong number', disposition: 'wrong_number',
    turns: [
      { role: 'agent', text: OPENING, ms: 1010 },
      { role: 'user', text: 'No, there’s no Jane here. You’ve got the wrong number.' },
      { role: 'agent', text: 'Apologies for the inconvenience — I’ll remove this number. Have a good day.', ms: 940 },
      { role: 'sys', text: 'tool_call → log_verification(status="wrong_number")' },
      { role: 'sys', text: 'number flagged in campaign state · clean hangup' },
    ],
  },
  {
    id: 'dnc', label: '😠 do-not-call request', disposition: 'dnc',
    turns: [
      { role: 'agent', text: OPENING, ms: 1050 },
      { role: 'user', text: 'Stop calling me. Put me on your do-not-call list right now.' },
      { role: 'sys', text: 'DNC intent overrides ALL other intents (rubric rule #1)' },
      { role: 'agent', text: 'Understood — I’m marking this number do-not-call effective immediately. You won’t hear from us again.', ms: 900 },
      { role: 'sys', text: 'tool_call → log_verification(status="dnc")' },
    ],
  },
  {
    id: 'human', label: '🙋 wants a human', disposition: 'customer_wants_human',
    turns: [
      { role: 'agent', text: OPENING, ms: 970 },
      { role: 'user', text: 'I’m not talking to a robot. Give me a real person.' },
      { role: 'agent', text: 'Absolutely — transferring you to a live agent now. Please hold.', ms: 860 },
      { role: 'sys', text: 'tool_call → log_verification(status="customer_wants_human")' },
      { role: 'sys', text: 'transfer to hunt group with context payload' },
    ],
  },
  {
    id: 'busy', label: '⏰ caller is busy', disposition: 'consumer_busy_end',
    turns: [
      { role: 'agent', text: OPENING, ms: 1020 },
      { role: 'user', text: 'I’m driving, I really can’t do this right now.' },
      { role: 'agent', text: 'No problem at all — we’ll try again at a better time. Drive safe!', ms: 880 },
      { role: 'sys', text: 'tool_call → log_verification(status="consumer_busy_end")' },
      { role: 'sys', text: 'callback scheduled per campaign policy' },
    ],
  },
]

export default function VoiceCallSandbox() {
  const touch = useSandboxTouch('voice-call')
  const [persona, setPersona] = useState<Persona | null>(null)
  const [shown, setShown] = useState<Turn[]>([])
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const start = (p: Persona) => {
    touch()
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
    setPersona(p)
    setShown([{ role: 'sys', text: 'TCN linkback → Retell webhook → identity payload {full_name: "Jane Smith"} returned in 41ms' }])
    setDone(false)
    let delay = 700
    p.turns.forEach((t, i) => {
      timerRef.current.push(setTimeout(() => {
        setShown((s) => [...s, t])
        if (i === p.turns.length - 1) setDone(true)
      }, delay))
      delay += t.role === 'sys' ? 800 : 1500
    })
  }

  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

  return (
    <SandboxShell
      id="voice-call"
      title="vta-emma — simulated verification call"
      note="the production agent runs on live SIP calls via LiveKit with Deepgram Flux STT and Cartesia TTS; the branches, dispositions and tool-call discipline here mirror the real system prompt. Latency figures shown are representative per-turn measurements."
    >
      <div className="sb-row" style={{ marginBottom: 12 }}>
        <span className="sb-label" style={{ alignSelf: 'center' }}>place a call as:</span>
        {PERSONAS.map((p) => (
          <button key={p.id} className={`chip ${persona?.id === p.id ? 'on' : ''}`} onClick={() => start(p)}>{p.label}</button>
        ))}
      </div>
      <div className="sb-log" style={{ minHeight: 280, maxHeight: 340 }}>
        {shown.length === 0 && <span className="t-sys">☎ pick a caller persona to dispatch the agent into a room…</span>}
        {shown.map((t, i) => (
          <span key={i} className={t.role === 'agent' ? 't-agent' : t.role === 'user' ? 't-user' : 't-sys'}>
            {t.role === 'agent' ? '🎙 emma: ' : t.role === 'user' ? '👤 caller: ' : '⚙ '}
            {t.text}
            {t.ms && <span className="t-sys">  [first-audio {t.ms}ms]</span>}
          </span>
        ))}
        {done && persona && (
          <span className="t-ok">
            ■ call ended · disposition: {persona.disposition} · transcript + summary shipped to Loki · metrics remote-written to Grafana Cloud
          </span>
        )}
      </div>
      {done && (
        <div className="mono-note" style={{ marginTop: 10 }}>
          note the two lines the LLM never touches: the opening and closing are hardcoded and spoken straight to TTS — compliance lines can’t be paraphrased.
        </div>
      )}
    </SandboxShell>
  )
}
