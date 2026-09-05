import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../store/appStore'
import { useLab } from '../../store/labStore'
import { projects } from '../../data/projects'
import { execute, AUTOCOMPLETE_TARGETS, type Ctx } from './commands'

type Entry = { id: number; node: ReactNode }
let seq = 1

const WELCOME: Entry = {
  id: 0,
  node: (
    <div>
      <div className="t-grn">mission-control shell v1.0 — connection established</div>
      <div className="t-dim">Type <span className="t-acc">help</span> for commands, <span className="t-acc">ls</span> for projects. Tab completes, ↑ recalls. New commands earn XP.</div>
    </div>
  ),
}

export default function Terminal() {
  const app = useApp()
  const navigate = useNavigate()
  const [entries, setEntries] = useState<Entry[]>([WELCOME])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [histIdx, setHistIdx] = useState(-1)
  const [suggest, setSuggest] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (app.termOpen) setTimeout(() => inputRef.current?.focus(), 80)
  }, [app.termOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [entries])

  const lab = useLab()

  const ctx: Ctx = {
    navigate,
    closeTerm: () => app.setTermOpen(false),
    setTheme: app.setTheme,
    setMode: app.setMode,
    setMatrix: app.setMatrix,
    unlock: app.unlock,
    addXp: app.addXp,
    reveal: (n) => app.reveal(n, projects.length),
    resetProgress: app.resetProgress,
    lab: {
      experiment: lab.experiment,
      setExperiment: lab.setExperiment,
      reset: lab.reset,
      randomize: lab.randomize,
    },
    state: {
      xp: app.xp,
      unlocked: app.unlocked,
      visited: app.visited,
      commandCount: app.commandCount,
      sandboxesTouched: app.sandboxesTouched,
      theme: app.theme,
      mode: app.mode,
      revealed: app.revealed,
    },
  }

  const run = (line: string) => {
    const trimmed = line.trim()
    const echo: Entry = {
      id: seq++,
      node: (
        <div className="term-line">
          <span className="p">➜ ~ </span>
          <span className="cmd-echo">{line}</span>
        </div>
      ),
    }
    if (!trimmed) { setEntries((e) => [...e, echo]); return }
    app.bumpCommands()
    if (trimmed === 'history') {
      const node = history.length
        ? <div>{[...history].reverse().map((h, i) => <div key={i}><span className="t-dim">{String(i + 1).padStart(3)} </span>{h}</div>)}</div>
        : <span className="t-dim">history is empty — you just got here.</span>
      setHistory((h) => ['history', ...h.slice(0, 49)])
      setHistIdx(-1)
      setEntries((e) => [...e, echo, { id: seq++, node: <div className="term-line">{node}</div> }])
      return
    }
    setHistory((h) => [trimmed, ...h.slice(0, 49)])
    setHistIdx(-1)
    const out = execute(trimmed, ctx)
    if (out === 'CLEAR') { setEntries([]); return }
    if (out === 'EXIT') { setEntries((e) => [...e, echo]); app.setTermOpen(false); return }
    setEntries((e) => [...e, echo, ...(out != null ? [{ id: seq++, node: <div className="term-line">{out}</div> }] : [])])
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setSuggest([])
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = Math.min(histIdx + 1, history.length - 1)
      if (history[idx] != null) { setHistIdx(idx); setInput(history[idx]) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = histIdx - 1
      if (idx < 0) { setHistIdx(-1); setInput('') }
      else { setHistIdx(idx); setInput(history[idx]) }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const parts = input.split(/\s+/)
      const last = parts[parts.length - 1]
      if (!last) return
      const matches = AUTOCOMPLETE_TARGETS.filter((c) => c.startsWith(last.toLowerCase()))
      if (matches.length === 1) {
        parts[parts.length - 1] = matches[0]
        setInput(parts.join(' ') + (parts.length === 1 ? ' ' : ''))
        setSuggest([])
      } else if (matches.length > 1) {
        setSuggest(matches.slice(0, 8))
      }
    } else if (e.key === '`') {
      // backtick toggles the terminal globally; swallow it so it doesn't type
      e.preventDefault()
      app.setTermOpen(false)
    } else {
      setSuggest([])
    }
  }

  return (
    <div className={`term-wrap ${app.termOpen ? 'open' : ''}`} aria-hidden={!app.termOpen}>
      <div className="term" onClick={() => inputRef.current?.focus()}>
        <div className="term-bar">
          <span className="t-grn">●</span>
          <span>arnab@mission-control : ~/shell</span>
          <button className="close" onClick={() => app.setTermOpen(false)} aria-label="close terminal">✕</button>
        </div>
        <div className="term-scroll" ref={scrollRef}>
          {entries.map((en) => <div key={en.id} className="term-line">{en.node}</div>)}
        </div>
        {suggest.length > 0 && (
          <div className="term-suggest">
            {suggest.map((s, i) => <span key={s}>{i > 0 && ' · '}<b>{s}</b></span>)}
          </div>
        )}
        <div className="term-input-row">
          <span className="p">➜ ~</span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="terminal input"
            placeholder="type help"
          />
        </div>
      </div>
    </div>
  )
}
