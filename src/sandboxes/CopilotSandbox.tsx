import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// The Phase-0 probe as a game: UI + audio signals stream in; label the call
// state before the deterministic reducer does. Mirrors the real 7 hotkey labels.
const STATES = ['idle', 'dialing', 'live human', 'voicemail', 'IVR', 'hold', 'ended'] as const
type CallState = typeof STATES[number]

type Round = { state: CallState; signals: string[] }

const ROUNDS: Round[] = [
  { state: 'dialing', signals: ['UIA: button "Hang Up" enabled=true', 'UIA: text "Dialing… 555-0142"', 'WASAPI: chrome.exe render session, peak 0.02 (ringback)'] },
  { state: 'live human', signals: ['UIA: timer "00:00:04" ticking', 'WASAPI: peak 0.61 with irregular bursts (speech cadence)', 'UIA: text "Connected"'] },
  { state: 'voicemail', signals: ['WASAPI: peak steady 0.45, continuous 8s (monologue)', 'UIA: timer ticking', 'no barge-in pauses detected'] },
  { state: 'IVR', signals: ['WASAPI: peak 0.5 with clean 440Hz-ish bursts (synthetic voice)', 'UIA: dialpad focus events firing', 'DTMF sent: "1"'] },
  { state: 'hold', signals: ['WASAPI: peak 0.3 perfectly periodic (music loop)', 'UIA: timer ticking', 'UIA: text "On Hold" visible=true'] },
  { state: 'ended', signals: ['UIA: button "Hang Up" enabled=false', 'WASAPI: session expired for chrome.exe', 'UIA: text "Wrap-up" appeared'] },
]

export default function CopilotSandbox() {
  const touch = useSandboxTouch('copilot')
  const [round, setRound] = useState(-1)
  const [shownSignals, setShownSignals] = useState<string[]>([])
  const [score, setScore] = useState({ you: 0, played: 0 })
  const [feedback, setFeedback] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const nextRound = () => {
    touch()
    timers.current.forEach(clearTimeout)
    const r = (round + 1) % ROUNDS.length
    setRound(r)
    setFeedback(null)
    setShownSignals([])
    ROUNDS[r].signals.forEach((s, i) => {
      timers.current.push(setTimeout(() => setShownSignals((x) => [...x, s]), 500 * (i + 1)))
    })
  }

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const guess = (s: CallState) => {
    if (round < 0 || feedback) return
    touch()
    const correct = ROUNDS[round].state === s
    setScore((sc) => ({ you: sc.you + (correct ? 1 : 0), played: sc.played + 1 }))
    setFeedback(correct
      ? `✓ correct — the reducer agrees: ${ROUNDS[round].state}. JSONL event labeled.`
      : `✗ the reducer says ${ROUNDS[round].state} — look at the audio peak pattern again.`)
  }

  return (
    <SandboxShell
      id="copilot"
      title="tcn-probe — label the call state from raw signals"
      note="the real probe reads redacted Microsoft UI Automation trees and WASAPI audio sessions from the live dialer desktop, with testers labeling via Ctrl+Alt hotkeys. These rounds use representative signal patterns; no transcript or raw audio exists in either version."
    >
      <div className="sb-grid2">
        <div className="sb-col">
          <div className="sb-row">
            <button className="btn small" onClick={nextRound}>{round < 0 ? '▶ start probe session' : '▶ next call event'}</button>
            <span className="mono-note">accuracy: {score.you}/{score.played}</span>
          </div>
          <span className="sb-label">signal feed (UIA + WASAPI)</span>
          <div className="sb-log" style={{ minHeight: 200 }}>
            {round < 0 && <span className="t-sys">start a session — signals will stream in like the live dashboard.</span>}
            {shownSignals.map((s, i) => <span key={i} className={s.startsWith('WASAPI') ? 't-amb' : 't-agent'}>{s}</span>)}
          </div>
        </div>
        <div className="sb-col">
          <span className="sb-label">your label (hotkeys Ctrl+Alt+1…7 in the real app)</span>
          <div className="sb-row">
            {STATES.map((s, i) => (
              <button key={s} className="chip" onClick={() => guess(s)} disabled={round < 0 || !!feedback}>
                {i + 1}· {s}
              </button>
            ))}
          </div>
          {feedback && (
            <div style={{ fontSize: 13, color: feedback.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{feedback}</div>
          )}
          <div className="mono-note" style={{ marginTop: 8 }}>
            These labels, fused with the UI and audio signals, become the training timeline for the Phase-1 reducer that has to know a human answered before the copilot says anything.
          </div>
        </div>
      </div>
    </SandboxShell>
  )
}
