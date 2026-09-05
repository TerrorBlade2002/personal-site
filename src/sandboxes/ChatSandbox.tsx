import { useEffect, useRef, useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// A tiny realtime room with two resident bots. No server — the point is the
// realtime *feel* the Firebase original had.
type Msg = { who: string; text: string; me?: boolean }

const BOTS = [
  { name: 'devranjan', lines: ['anyone else deploying on a friday? 😅', 'firebase quotas are a lifestyle', 'brb, prod is on fire (the usual)', 'hot take: dark mode is the only mode', 'this chat app survived 2024 and so did we'] },
  { name: 'priya_codes', lines: ['just shipped, wish me luck 🚀', 'who broke the build? 👀', 'vite hot reload is actual magic', 'coffee count today: 4 and rising', 'lgtm — but did you test it?'] },
]

export default function ChatSandbox() {
  const touch = useSandboxTouch('chat')
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: 'system', text: 'joined #general · 3 online' },
    { who: 'devranjan', text: 'o/ welcome to the room' },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [msgs])

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.5) {
        const bot = BOTS[Math.floor(Math.random() * BOTS.length)]
        setMsgs((m) => [...m.slice(-40), { who: bot.name, text: bot.lines[Math.floor(Math.random() * bot.lines.length)] }])
      }
    }, 5200)
    return () => clearInterval(iv)
  }, [])

  const send = () => {
    const text = input.trim()
    if (!text) return
    touch()
    setMsgs((m) => [...m.slice(-40), { who: 'you', text, me: true }])
    setInput('')
    setTimeout(() => {
      const bot = BOTS[Math.floor(Math.random() * BOTS.length)]
      const reply = text.endsWith('?')
        ? 'good question — in the real app that would hit Firestore and fan out to every listener'
        : bot.lines[Math.floor(Math.random() * bot.lines.length)]
      setMsgs((m) => [...m.slice(-40), { who: bot.name, text: reply }])
    }, 900 + Math.random() * 1200)
  }

  return (
    <SandboxShell
      id="chat"
      title="lets-chat — #general"
      note="the deployed original uses Firebase Auth + Firestore snapshot listeners, so every client receives writes in realtime. Here the 'other users' are two friendly bots and your messages never leave this tab."
    >
      <div className="sb-log" ref={scrollRef} style={{ minHeight: 240, maxHeight: 280 }}>
        {msgs.map((m, i) => (
          <span key={i} className={m.me ? 't-user' : m.who === 'system' ? 't-sys' : 't-agent'}>
            {m.who === 'system' ? '· ' : <b style={{ fontWeight: 700 }}>{m.who}: </b>}{m.text}
          </span>
        ))}
      </div>
      <div className="sb-row" style={{ marginTop: 10 }}>
        <input
          className="sb-input" style={{ flex: 1 }}
          placeholder="message #general…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn small" onClick={send}>send ➤</button>
      </div>
    </SandboxShell>
  )
}
