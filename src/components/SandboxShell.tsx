import type { ReactNode } from 'react'
import { useApp } from '../store/appStore'

// Common chrome for every demo: title bar, DEMO tag, and a footnote on how the
// demo differs from the production system it stands in for.
export default function SandboxShell({ title, note, children }: {
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
        <span className="badge">DEMO</span>
      </div>
      <div className="sandbox-body">{children}</div>
      <div className="sandbox-note"><b>Compared with production:</b> {note}</div>
    </div>
  )
}

export function useSandboxTouch(id: string) {
  const touch = useApp((s) => s.touchSandbox)
  return () => touch(id)
}
