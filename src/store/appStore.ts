import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Achievement = { id: string; name: string; desc: string; icon: string }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-contact', name: 'First Contact', desc: 'Boarded Mission Control', icon: '🛰️' },
  { id: 'terminal-hacker', name: 'Terminal Hacker', desc: 'Ran your first command', icon: '⌨️' },
  { id: 'power-user', name: 'Power User', desc: 'Ran 10 terminal commands', icon: '⚡' },
  { id: 'declassified', name: 'Declassified', desc: 'Revealed the project archive', icon: '🔓' },
  { id: 'explorer', name: 'Explorer', desc: 'Visited 5 project systems', icon: '🧭' },
  { id: 'completionist', name: 'Completionist', desc: 'Visited every project system', icon: '🏆' },
  { id: 'lab-rat', name: 'Lab Rat', desc: 'Experimented in 3 sandboxes', icon: '🧪' },
  { id: 'mad-scientist', name: 'Mad Scientist', desc: 'Experimented in 8 sandboxes', icon: '⚗️' },
  { id: 'physicist', name: 'Physicist', desc: 'Tinkered with the physics lab', icon: '🔬' },
  { id: 'red-pill', name: 'Red Pill', desc: 'Saw the Matrix', icon: '💊' },
  { id: 'recruiter-mode', name: 'Recruiter Mode', desc: 'sudo hire-me', icon: '💼' },
  { id: 'theme-shifter', name: 'Theme Shifter', desc: 'Re-painted the console', icon: '🎨' },
]

export type Toast = { id: number; title: string; body: string }

export const MODES = ['dark', 'dim', 'light'] as const
export type Mode = typeof MODES[number]
export const ACCENTS = ['cyan', 'green', 'amber', 'violet', 'pink'] as const
export type Accent = typeof ACCENTS[number]

export const REVEAL_STEP = 3

// The <html> data attributes drive every CSS token and are read by the 3D
// scene, so they are set synchronously here (not in a React effect) — child
// effects would otherwise run before the attribute lands.
export function applyThemeToDom(mode: Mode, accent: Accent) {
  const el = document.documentElement
  el.dataset.mode = mode
  el.dataset.accent = accent
  el.style.colorScheme = mode === 'light' ? 'light' : 'dark'
}

type AppState = {
  termOpen: boolean
  theme: Accent
  mode: Mode
  xp: number
  unlocked: string[]
  visited: string[]
  sandboxesTouched: string[]
  commandCount: number
  matrixOn: boolean
  toasts: Toast[]
  revealed: number
  hdrCollapsed: boolean
  setTermOpen: (v: boolean) => void
  setTheme: (t: Accent) => void
  setMode: (m: Mode) => void
  cycleMode: () => void
  setMatrix: (v: boolean) => void
  addXp: (n: number) => void
  unlock: (id: string) => void
  visitProject: (slug: string, total: number) => void
  touchSandbox: (id: string) => void
  bumpCommands: () => void
  reveal: (n: number, total: number) => void
  setHdrCollapsed: (v: boolean) => void
  resetProgress: () => void
  pushToast: (title: string, body: string) => void
  popToast: (id: number) => void
}

type PersistedSlice = Pick<AppState, 'theme' | 'mode' | 'xp' | 'unlocked' | 'visited' | 'sandboxesTouched' | 'commandCount'>

let toastSeq = 1

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      termOpen: false,
      theme: 'cyan',
      mode: 'dark',
      xp: 0,
      unlocked: [],
      visited: [],
      sandboxesTouched: [],
      commandCount: 0,
      matrixOn: false,
      toasts: [],
      revealed: 0,
      hdrCollapsed: false,
      setTermOpen: (v) => set({ termOpen: v }),
      setTheme: (t) => {
        applyThemeToDom(get().mode, t)
        set({ theme: t })
        get().unlock('theme-shifter')
      },
      setMode: (m) => {
        applyThemeToDom(m, get().theme)
        set({ mode: m })
        get().unlock('theme-shifter')
      },
      cycleMode: () => {
        const s = get()
        s.setMode(MODES[(MODES.indexOf(s.mode) + 1) % MODES.length])
      },
      setMatrix: (v) => set({ matrixOn: v }),
      addXp: (n) => set((s) => ({ xp: s.xp + n })),
      unlock: (id) => {
        const s = get()
        if (s.unlocked.includes(id)) return
        const a = ACHIEVEMENTS.find((x) => x.id === id)
        if (!a) return
        set({ unlocked: [...s.unlocked, id], xp: s.xp + 25 })
        s.pushToast(`${a.icon} Achievement unlocked`, `${a.name} — ${a.desc} (+25 xp)`)
      },
      visitProject: (slug, total) => {
        const s = get()
        if (s.visited.includes(slug)) return
        const visited = [...s.visited, slug]
        set({ visited, xp: s.xp + 10 })
        if (visited.length >= 5) s.unlock('explorer')
        if (visited.length >= total) s.unlock('completionist')
      },
      touchSandbox: (id) => {
        const s = get()
        if (s.sandboxesTouched.includes(id)) return
        const touched = [...s.sandboxesTouched, id]
        set({ sandboxesTouched: touched, xp: s.xp + 15 })
        if (touched.length >= 3) s.unlock('lab-rat')
        if (touched.length >= 8) s.unlock('mad-scientist')
      },
      bumpCommands: () => {
        const s = get()
        const n = s.commandCount + 1
        set({ commandCount: n, xp: s.xp + 2 })
        if (n === 1) s.unlock('terminal-hacker')
        if (n >= 10) s.unlock('power-user')
      },
      reveal: (n, total) => {
        const s = get()
        const next = Math.min(total, Math.max(s.revealed, n))
        if (next === s.revealed) return
        set({ revealed: next, xp: s.xp + 5 })
        s.unlock('declassified')
      },
      setHdrCollapsed: (v) => set({ hdrCollapsed: v }),
      resetProgress: () => {
        set({ xp: 0, unlocked: [], visited: [], sandboxesTouched: [], commandCount: 0, revealed: 0 })
        get().pushToast('🧹 Progress wiped', 'XP, achievements and visit history cleared for this browser.')
      },
      pushToast: (title, body) => {
        const id = toastSeq++
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, title, body }] }))
        setTimeout(() => get().popToast(id), 4600)
      },
      popToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'mission-control',
      version: 1,
      // shape has been stable since v0 — carry stored progress forward untouched
      migrate: (persisted) => persisted as PersistedSlice,
      // `revealed` is deliberately not persisted: the archive starts hidden on
      // every visit and is opened by the visitor, never shown proactively.
      partialize: (s): PersistedSlice => ({
        theme: s.theme,
        mode: s.mode,
        xp: s.xp,
        unlocked: s.unlocked,
        visited: s.visited,
        sandboxesTouched: s.sandboxesTouched,
        commandCount: s.commandCount,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>
        const theme = (ACCENTS as readonly string[]).includes(p.theme as string) ? (p.theme as Accent) : current.theme
        const mode = (MODES as readonly string[]).includes(p.mode as string) ? (p.mode as Mode) : current.mode
        return { ...current, ...p, theme, mode }
      },
    },
  ),
)

export const levelFor = (xp: number) => Math.floor(Math.sqrt(xp / 40)) + 1
export const levelProgress = (xp: number) => {
  const lvl = levelFor(xp)
  const cur = 40 * (lvl - 1) ** 2
  const next = 40 * lvl ** 2
  return Math.min(1, (xp - cur) / (next - cur))
}
export const RANKS = ['Cadet', 'Ensign', 'Pilot', 'Specialist', 'Commander', 'Captain', 'Admiral', 'Legend']
export const rankFor = (xp: number) => RANKS[Math.min(RANKS.length - 1, levelFor(xp) - 1)]
