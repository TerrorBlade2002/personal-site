import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Latency budget builder — the numbers come from the livekit-worker README's
// measured figures. Goal: land first audio near ~1s and e2e p95 under 1.5s.
const STT = [
  { id: 'flux', label: 'Deepgram Flux (eager EOT)', eou: 260 },
  { id: 'flux-safe', label: 'Deepgram Flux (safe EOT)', eou: 410 },
  { id: 'aai', label: 'AssemblyAI Universal', eou: 380 },
]
const LLM = [
  { id: '41mini', label: 'gpt-4.1-mini (fastest)', ttft: 900 },
  { id: '51chat', label: 'gpt-5.1-chat (default)', ttft: 1300 },
  { id: '51', label: 'gpt-5.1 reasoning', ttft: 2200 },
]
const TTS = [
  { id: 'sonic', label: 'Cartesia Sonic 3.5', ttfb: 90 },
  { id: 'generic', label: 'generic non-streaming TTS', ttfb: 480 },
]

export default function PipelineSandbox() {
  const touch = useSandboxTouch('pipeline')
  const [stt, setStt] = useState(STT[0])
  const [llm, setLlm] = useState(LLM[1])
  const [tts, setTts] = useState(TTS[0])
  const [preemptive, setPreemptive] = useState(true)
  const [colocated, setColocated] = useState(true)

  // preemptive generation overlaps LLM start with the end-of-turn window
  const overlap = preemptive ? Math.min(stt.eou, 250) : 0
  const network = colocated ? 40 : 220
  const total = stt.eou + llm.ttft + tts.ttfb + network - overlap
  const budgetOk = total <= 1500
  const greatOk = total <= 1050

  const stages = [
    { name: 'STT end-of-turn', ms: stt.eou, color: 'var(--accent)' },
    { name: preemptive ? 'LLM TTFT (−overlap)' : 'LLM TTFT', ms: llm.ttft - overlap, color: 'var(--violet)' },
    { name: 'TTS first byte', ms: tts.ttfb, color: 'var(--green)' },
    { name: colocated ? 'network (co-located)' : 'network (per-provider APIs)', ms: network, color: 'var(--amber)' },
  ]

  const pick = <T,>(setter: (v: T) => void) => (v: T) => { touch(); setter(v) }

  return (
    <SandboxShell
      id="pipeline"
      title="latency-lab — build the cascaded pipeline yourself"
      note="stage timings are the real measured figures from the production worker (Flux ~260ms p50 eager EOT, Sonic ~90ms TTFB, GPT TTFTs as benchmarked). The interaction model is simplified — real turns also involve VAD, endpointing delays and barge-in."
    >
      <div className="sb-grid2">
        <div className="sb-col">
          <span className="sb-label">speech-to-text</span>
          <div className="sb-row">{STT.map((o) => <button key={o.id} className={`chip ${stt.id === o.id ? 'on' : ''}`} onClick={() => pick(setStt)(o)}>{o.label}</button>)}</div>
          <span className="sb-label">llm</span>
          <div className="sb-row">{LLM.map((o) => <button key={o.id} className={`chip ${llm.id === o.id ? 'on' : ''}`} onClick={() => pick(setLlm)(o)}>{o.label}</button>)}</div>
          <span className="sb-label">text-to-speech</span>
          <div className="sb-row">{TTS.map((o) => <button key={o.id} className={`chip ${tts.id === o.id ? 'on' : ''}`} onClick={() => pick(setTts)(o)}>{o.label}</button>)}</div>
          <span className="sb-label">tricks</span>
          <div className="sb-row">
            <button className={`chip ${preemptive ? 'on' : ''}`} onClick={() => { touch(); setPreemptive(!preemptive) }}>preemptive generation</button>
            <button className={`chip ${colocated ? 'on' : ''}`} onClick={() => { touch(); setColocated(!colocated) }}>co-located inference</button>
          </div>
        </div>
        <div className="sb-col">
          <span className="sb-label">turn waterfall — user stops speaking → first agent audio</span>
          {stages.map((s) => (
            <div className="hbar" key={s.name}>
              <span className="name">{s.name}</span>
              <span className="track"><i className="fill" style={{ width: `${Math.min(100, (s.ms / 2400) * 100)}%`, background: s.color }} /></span>
              <span className="val">{s.ms}ms</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
            <span className="gauge-num" style={{ color: greatOk ? 'var(--green)' : budgetOk ? 'var(--amber)' : 'var(--red)' }}>{(total / 1000).toFixed(2)}s</span>
            <span className="mono-note">to first audio</span>
          </div>
          <div className="sb-kv"><span>≤1.05s — production target</span><b style={{ color: greatOk ? 'var(--green)' : 'var(--muted)' }}>{greatOk ? '✓ HIT' : '—'}</b></div>
          <div className="sb-kv"><span>≤1.50s — e2e p95 budget</span><b style={{ color: budgetOk ? 'var(--green)' : 'var(--red)' }}>{budgetOk ? '✓ within budget' : '✗ BLOWN — callers will talk over the agent'}</b></div>
          {llm.id === '51' && <div className="mono-note">reasoning models are reserved for escalation paths in production — too slow for the live loop, exactly as you’re seeing.</div>}
        </div>
      </div>
    </SandboxShell>
  )
}
