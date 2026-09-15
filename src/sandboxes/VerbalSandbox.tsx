import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Text-mode miniature of the speech scorer: same four axes, transparent
// heuristics instead of the SpeechSuper API.
const QUESTION = 'Tell me about a time you handled a difficult customer.'
const FILLERS = ['um', 'uh', 'like', 'basically', 'actually', 'literally', 'you know', 'kind of', 'sort of']
const CONFIDENT = ['i led', 'i decided', 'i resolved', 'i handled', 'i ensured', 'i solved', 'i took', 'i built', 'i owned', 'i fixed']

function scoreAnswer(text: string) {
  const clean = text.toLowerCase()
  const words = clean.split(/\s+/).filter(Boolean)
  const unique = new Set(words).size
  const fillerCount = FILLERS.reduce((n, f) => n + (clean.split(f).length - 1), 0)
  const confidentCount = CONFIDENT.reduce((n, c) => n + (clean.includes(c) ? 1 : 0), 0)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3).length

  const fluency = Math.max(10, Math.min(95, 40 + words.length * 0.7 - fillerCount * 8))
  const clarity = Math.max(10, Math.min(95, sentences * 14 + (words.length > 0 ? (unique / words.length) * 45 : 0)))
  const vocab = Math.max(10, Math.min(95, (unique / Math.max(1, words.length)) * 80 + Math.min(20, unique * 0.5)))
  const confidence = Math.max(10, Math.min(95, 30 + confidentCount * 16 - fillerCount * 5))
  return { fluency, clarity, vocab, confidence, words: words.length, fillerCount, confidentCount, sentences }
}

export default function VerbalSandbox() {
  const touch = useSandboxTouch('verbal')
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<ReturnType<typeof scoreAnswer> | null>(null)

  const grade = () => { touch(); setResult(scoreAnswer(answer)) }
  const overall = result ? (result.fluency + result.clarity + result.vocab + result.confidence) / 4 : 0

  const axes = result ? [
    { name: 'fluency', v: result.fluency, why: `${result.words} words, ${result.fillerCount} filler words` },
    { name: 'clarity', v: result.clarity, why: `${result.sentences} complete sentences` },
    { name: 'vocabulary', v: result.vocab, why: 'lexical diversity (unique/total words)' },
    { name: 'confidence', v: result.confidence, why: `${result.confidentCount} ownership phrases (“I led”, “I resolved”…)` },
  ] : []

  return (
    <SandboxShell
      id="verbal"
      title="verbal-assess — one-question mini interview"
      note="the production system records real audio (MediaRecorder → FFmpeg → 16kHz mono WAV) and scores it with the SpeechSuper API across the same four axes. This text edition uses transparent heuristics so you can see exactly what moves each score."
    >
      <div className="sb-col">
        <span className="sb-label">interviewer asks:</span>
        <div style={{ fontSize: 14.5, color: 'var(--text)' }}>🎤 “{QUESTION}”</div>
        <textarea
          className="sb-input"
          style={{ minHeight: 110, resize: 'vertical', width: '100%' }}
          placeholder="type your answer as you would say it out loud… (fillers count against you, ownership verbs count for you)"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div className="sb-row">
          <button className="btn small" onClick={grade} disabled={answer.trim().length < 10}>⚖ score my answer</button>
          {result && <span className="gauge-num" style={{ fontSize: 26, color: overall > 70 ? 'var(--green)' : overall > 45 ? 'var(--amber)' : 'var(--red)' }}>{overall.toFixed(0)}/100</span>}
        </div>
        {result && (
          <div className="sb-col" style={{ gap: 8 }}>
            {axes.map((a) => (
              <div key={a.name}>
                <div className="hbar">
                  <span className="name">{a.name}</span>
                  <span className="track"><i className="fill" style={{ width: `${a.v}%`, background: a.v > 70 ? 'var(--green)' : a.v > 45 ? 'var(--amber)' : 'var(--red)' }} /></span>
                  <span className="val">{a.v.toFixed(0)}</span>
                </div>
                <div className="mono-note" style={{ marginLeft: 138 }}>{a.why}</div>
              </div>
            ))}
            <div className="mono-note">
              {overall > 70 ? 'Strong answer — structured, confident, low filler.' : 'Drop the fillers, add one “I resolved / led / handled” sentence, and finish with the outcome.'}
            </div>
          </div>
        )}
      </div>
    </SandboxShell>
  )
}
