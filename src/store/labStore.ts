import { create } from 'zustand'

// Shared state for the interactive scene on the landing page. Read by the 3D
// scene, the HTML control rail/drawer and the terminal's `lab` command.
export const EXPERIMENTS = ['pendulum', 'slits'] as const
export type Experiment = typeof EXPERIMENTS[number]

export const EXPERIMENT_META: Record<Experiment, { name: string; short: string; blurb: string }> = {
  pendulum: {
    name: 'Double pendulum',
    short: 'pendulum',
    blurb: 'Chaotic motion: the ghost copies start a thousandth of a radian apart and still diverge. Drag either bob to set a new start.',
  },
  slits: {
    name: 'Double slit',
    short: 'slits',
    blurb: 'Wave interference: the far screen shows the fringe pattern. Close one slit and it disappears.',
  },
}

export type PendulumParams = {
  gravity: number; damping: number; ghosts: number; speed: number; paused: boolean
  th1: number; th2: number // initial angles used on reset
}
export type SlitParams = { separation: number; wavelength: number; slit1: boolean; slit2: boolean; paused: boolean }

export const DEFAULT_PENDULUM: PendulumParams = { gravity: 9.81, damping: 0, ghosts: 4, speed: 1, paused: false, th1: 2.35, th2: 2.0 }
export const DEFAULT_SLITS: SlitParams = { separation: 1.4, wavelength: 0.55, slit1: true, slit2: true, paused: false }

type LabState = {
  experiment: Experiment
  resetSeq: number
  pendulum: PendulumParams
  slits: SlitParams
  readout: Record<string, string> // live values written by the simulation
  setExperiment: (e: Experiment) => void
  reset: () => void
  randomize: () => void
  setPendulum: (p: Partial<PendulumParams>) => void
  setSlits: (p: Partial<SlitParams>) => void
  setReadout: (r: Record<string, string>) => void
}

export const useLab = create<LabState>()((set) => ({
  experiment: 'pendulum',
  resetSeq: 0,
  pendulum: DEFAULT_PENDULUM,
  slits: DEFAULT_SLITS,
  readout: {},
  setExperiment: (e) => set({ experiment: e, readout: {} }),
  reset: () => set((s) => ({
    resetSeq: s.resetSeq + 1,
    pendulum: { ...DEFAULT_PENDULUM, ghosts: s.pendulum.ghosts },
    slits: { ...DEFAULT_SLITS },
  })),
  randomize: () => set((s) => ({
    resetSeq: s.resetSeq + 1,
    pendulum: {
      ...s.pendulum,
      paused: false,
      th1: (Math.random() * 2 - 1) * Math.PI * 0.95,
      th2: (Math.random() * 2 - 1) * Math.PI * 0.95,
    },
  })),
  setPendulum: (p) => set((s) => ({ pendulum: { ...s.pendulum, ...p } })),
  setSlits: (p) => set((s) => ({ slits: { ...s.slits, ...p } })),
  setReadout: (r) => set({ readout: r }),
}))
