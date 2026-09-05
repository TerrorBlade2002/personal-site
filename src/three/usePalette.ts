import { useEffect, useState } from 'react'
import { useApp } from '../store/appStore'

// The 3D scene is themed from the same CSS tokens as the rest of the site.
// Tokens are re-read whenever the mode or accent changes; the store applies the
// <html> data attributes synchronously, so the read always sees the new values.
const KEYS = [
  'bg', 'bg2', 'panel', 'panel2', 'line', 'line-bright', 'text', 'muted', 'dim',
  'accent', 'green', 'violet', 'amber', 'red', 'pink', 'cyan', 'grid-major', 'grid-minor',
] as const

export type Palette = Record<typeof KEYS[number], string>

function read(): Palette {
  const cs = getComputedStyle(document.documentElement)
  const out = {} as Palette
  for (const k of KEYS) out[k] = cs.getPropertyValue(`--${k}`).trim() || '#808080'
  return out
}

export function usePalette(): Palette {
  const mode = useApp((s) => s.mode)
  const accent = useApp((s) => s.theme)
  const [pal, setPal] = useState<Palette>(read)
  useEffect(() => { setPal(read()) }, [mode, accent])
  return pal
}
