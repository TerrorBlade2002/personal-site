import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Edge-case scoreboard: the same six utterance classes the real GEPA rubric
// targets, routed by a "baseline" vs an "optimized" prompt.
type Case = { utterance: string; want: string; baseline: { got: string; ok: boolean }; optimized: { got: string; ok: boolean } }

const CASES: Case[] = [
  {
    utterance: '“Yeah this is him — actually wait, stop calling this number.”',
    want: 'dnc (DNC overrides identity confirmation)',
    baseline: { got: 'verified → continue script', ok: false },
    optimized: { got: 'dnc → immediate opt-out', ok: true },
  },
  {
    utterance: '“Uh… I guess that’s me?”',
    want: 'weak_confirmation → re-verify',
    baseline: { got: 'verified → proceed', ok: false },
    optimized: { got: 'weak_confirmation → asks one more check', ok: true },
  },
  {
    utterance: '“He’s my husband, he’s at work right now.”',
    want: 'third_party → routing, not wrong_number',
    baseline: { got: 'wrong_number → hang up', ok: false },
    optimized: { got: 'third_party → callback flow', ok: true },
  },
  {
    utterance: '“I’m slammed right now but yeah it’s me.”',
    want: 'busy + confirmed → offer callback',
    baseline: { got: 'busy → generic apology, no capture', ok: false },
    optimized: { got: 'confirmed_busy → logs + schedules callback', ok: true },
  },
  {
    utterance: '“This is she— sorry, hang on— okay yes it’s me.”',
    want: 'interruption-tolerant confirmation',
    baseline: { got: 'confirmed', ok: true },
    optimized: { got: 'confirmed', ok: true },
  },
  {
    utterance: '“Don’t call me again unless it’s about the refund.”',
    want: 'compound: conditional DNC → dnc (safety first)',
    baseline: { got: 'continues about refund', ok: false },
    optimized: { got: 'dnc + notes the refund context', ok: true },
  },
]

export default function GepaSandbox() {
  const touch = useSandboxTouch('gepa')
  const [optimized, setOptimized] = useState(false)
  const [revealed, setRevealed] = useState(0)

  const run = () => {
    touch()
    setRevealed(0)
    CASES.forEach((_, i) => setTimeout(() => setRevealed(i + 1), 350 * (i + 1)))
  }

  const key = optimized ? 'optimized' : 'baseline'
  const score = CASES.slice(0, revealed).filter((c) => c[key as 'baseline'].ok).length

  return (
    <SandboxShell
      id="gepa"
      title="gepa-lab — baseline vs optimized prompt, same edge cases"
      note="verdicts shown are illustrative of the failure modes the real rubric targets (DNC priority, weak confirmations, third-party routing, compound utterances). The production loop optimizes with DSPy signatures + GEPA reflective evolution and exports a reviewed prompt artifact."
    >
      <div className="sb-row" style={{ marginBottom: 12 }}>
        <button className={`chip ${!optimized ? 'on' : ''}`} onClick={() => { touch(); setOptimized(false); setRevealed(0) }}>baseline prompt</button>
        <button className={`chip ${optimized ? 'on' : ''}`} onClick={() => { touch(); setOptimized(true); setRevealed(0) }}>GEPA-optimized prompt</button>
        <button className="btn small" onClick={run}>▶ run eval suite</button>
        {revealed > 0 && (
          <span className="mono-note">score: <b style={{ color: score === revealed ? 'var(--green)' : 'var(--amber)' }}>{score}/{revealed}</b></span>
        )}
      </div>
      <div className="sb-col" style={{ gap: 8 }}>
        {CASES.slice(0, revealed).map((c, i) => {
          const r = c[key as 'baseline']
          return (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '9px 12px', background: 'var(--panel)' }}>
              <div style={{ fontSize: 13 }}><span className="t-user">👤 {c.utterance}</span></div>
              <div className="mono-note">expected: {c.want}</div>
              <div style={{ fontSize: 12.5, marginTop: 3 }}>
                <span className={`verdict ${r.ok ? 'pass' : 'fail'}`}>{r.ok ? 'PASS' : 'FAIL'}</span>
                <span style={{ marginLeft: 8, color: r.ok ? 'var(--green)' : 'var(--red)' }}>routed: {r.got}</span>
              </div>
            </div>
          )
        })}
        {revealed === 0 && <span className="t-sys" style={{ fontSize: 12.5 }}>pick a prompt, run the suite, compare the scoreboards. Then imagine tuning this by hand at 11pm — that’s why the optimizer exists.</span>}
        {revealed === CASES.length && !optimized && (
          <div className="mono-note">now flip to the <b style={{ color: 'var(--accent)' }}>GEPA-optimized prompt</b> and re-run — the rubric’s priority rules (DNC beats everything) are what the optimizer learned to respect.</div>
        )}
      </div>
    </SandboxShell>
  )
}
