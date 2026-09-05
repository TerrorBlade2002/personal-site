import type { ReactNode } from 'react'
import { useApp } from '../store/appStore'

// Common chrome for every sandbox: title bar, SIMULATION badge, honesty note.
// Calling `touch()` on first meaningful interaction feeds the XP system.
export default function SandboxShell({ id, title, note, children }: {
  id: string
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <div className="sandbox">
      <div className="sandbox-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="title">{title}</span>
        <span className="badge">SIMULATION</span>
      </div>
      <div className="sandbox-body">{children}</div>
      <div className="sandbox-note">⚠ honest-abstraction notice: {note}</div>
    </div>
  )
}

export function useSandboxTouch(id: string) {
  const touch = useApp((s) => s.touchSandbox)
  return () => touch(id)
}
