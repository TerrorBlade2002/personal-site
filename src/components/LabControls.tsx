import { useEffect, useState } from 'react'
import { EXPERIMENT_META, useLab } from '../store/labStore'
import { useApp } from '../store/appStore'

// Controls for the interactive scene: a slim icon rail on the right edge
// (experiment, pause, reset, randomize, tune) and a drawer for the parameters.
// Everything is closed by default so the scene and the copy stay unobstructed.
// A wordless drag cue appears once, then dismisses on first interaction.

const PendulumIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 4h14" /><path d="M12 4v2.5" /><path d="M12 6.5l4 5.5" />
    <circle cx="16.3" cy="12.4" r="1.5" fill="currentColor" stroke="none" />
    <path d="M16.3 12.4l-3.6 5.4" /><circle cx="12.2" cy="19.2" r="2.2" fill="currentColor" stroke="none" />
  </svg>
)
const WavesIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
    <path d="M3 8c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0" /><path d="M3 13c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0" /><path d="M3 18c2.5-2.6 5-2.6 7.5 0s5 2.6 7.5 0" />
  </svg>
)
const HandIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" /><path d="M11 11.5V4.5a1.5 1.5 0 0 1 3 0V12" />
    <path d="M14 11.5V6.5a1.5 1.5 0 0 1 3 0V13" /><path d="M17 12.5a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2a6 6 0 0 1-5-2.7L4.2 15.6a1.5 1.5 0 0 1 2.4-1.8L8 15.5" />
  </svg>
)

export default function LabControls() {
  const lab = useLab()
  const unlock = useApp((s) => s.unlock)
  const [open, setOpen] = useState(false)
  const [cue, setCue] = useState(true)
  const meta = EXPERIMENT_META[lab.experiment]
  const touch = () => unlock('physicist')
  const isPendulum = lab.experiment === 'pendulum'
  const paused = isPendulum ? lab.pendulum.paused : lab.slits.paused

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Drag cue: gone on the first pointer interaction anywhere, or after a while.
  useEffect(() => {
    const off = () => setCue(false)
    const t = setTimeout(off, 9000)
    window.addEventListener('pointerdown', off, { once: true })
    return () => { clearTimeout(t); window.removeEventListener('pointerdown', off) }
  }, [])

  const togglePause = () => {
    if (isPendulum) lab.setPendulum({ paused: !lab.pendulum.paused })
    else lab.setSlits({ paused: !lab.slits.paused })
    touch()
  }

  return (
    <>
      {cue && isPendulum && (
        <div className="lab-cue" aria-hidden>
          <HandIcon />
          <span>drag</span>
        </div>
      )}

      <div className="lab-rail" data-testid="lab-rail" role="toolbar" aria-label="scene controls">
        <button
          className={`rail-btn ${isPendulum ? 'on' : ''}`}
          data-tip="Double pendulum"
          data-testid="lab-exp-pendulum"
          aria-pressed={isPendulum}
          onClick={() => { lab.setExperiment('pendulum'); touch() }}
        ><PendulumIcon /></button>
        <button
          className={`rail-btn ${!isPendulum ? 'on' : ''}`}
          data-tip="Double slit"
          data-testid="lab-exp-slits"
          aria-pressed={!isPendulum}
          onClick={() => { lab.setExperiment('slits'); touch() }}
        ><WavesIcon /></button>
        <i className="rail-sep" />
        <button className="rail-btn" data-tip={paused ? 'Resume' : 'Pause'} onClick={togglePause} aria-label={paused ? 'resume' : 'pause'}>
          {paused ? '▶' : '❙❙'}
        </button>
        <button className="rail-btn" data-tip="Reset" onClick={() => { lab.reset(); touch() }} aria-label="reset">↺</button>
        {isPendulum && (
          <button className="rail-btn" data-tip="Randomize" onClick={() => { lab.randomize(); touch() }} aria-label="randomize">⚄</button>
        )}
        <i className="rail-sep" />
        <button
          className={`rail-btn ${open ? 'on' : ''}`}
          data-tip={open ? 'Close' : 'Parameters'}
          data-testid="lab-tune"
          aria-expanded={open}
          onClick={() => { setOpen(!open); touch() }}
        >⚙</button>
      </div>

      <aside className={`lab-drawer ${open ? 'open' : ''}`} data-testid="lab-drawer" aria-hidden={!open}>
        <div className="lab-drawer-head">
          <b>{meta.name}</b>
          <button className="close" onClick={() => setOpen(false)} aria-label="close">✕</button>
        </div>
        <p className="lab-blurb">{meta.blurb}</p>

        {isPendulum ? (
          <>
            <div className="lab-row">
              <label>gravity</label>
              <input type="range" min={1} max={25} step={0.1} value={lab.pendulum.gravity}
                onChange={(e) => { lab.setPendulum({ gravity: +e.target.value }); touch() }} />
              <span className="v">{lab.pendulum.gravity.toFixed(1)}</span>
            </div>
            <div className="lab-row">
              <label>damping</label>
              <input type="range" min={0} max={0.6} step={0.01} value={lab.pendulum.damping}
                onChange={(e) => { lab.setPendulum({ damping: +e.target.value }); touch() }} />
              <span className="v">{lab.pendulum.damping.toFixed(2)}</span>
            </div>
            <div className="lab-row">
              <label>ghosts</label>
              <input type="range" min={0} max={8} step={1} value={lab.pendulum.ghosts}
                onChange={(e) => { lab.setPendulum({ ghosts: +e.target.value }); touch() }} />
              <span className="v">{lab.pendulum.ghosts}</span>
            </div>
            <div className="lab-row">
              <label>time scale</label>
              <input type="range" min={0.1} max={2.5} step={0.1} value={lab.pendulum.speed}
                onChange={(e) => { lab.setPendulum({ speed: +e.target.value }); touch() }} />
              <span className="v">{lab.pendulum.speed.toFixed(1)}×</span>
            </div>
          </>
        ) : (
          <>
            <div className="lab-row">
              <label>slit gap d</label>
              <input type="range" min={0.5} max={3} step={0.02} value={lab.slits.separation}
                onChange={(e) => { lab.setSlits({ separation: +e.target.value }); touch() }} />
              <span className="v">{lab.slits.separation.toFixed(2)}</span>
            </div>
            <div className="lab-row">
              <label>wavelength λ</label>
              <input type="range" min={0.3} max={1.2} step={0.01} value={lab.slits.wavelength}
                onChange={(e) => { lab.setSlits({ wavelength: +e.target.value }); touch() }} />
              <span className="v">{lab.slits.wavelength.toFixed(2)}</span>
            </div>
            <div className="lab-chips">
              <button className={`chip ${lab.slits.slit1 ? 'on' : ''}`} onClick={() => { lab.setSlits({ slit1: !lab.slits.slit1 }); touch() }}>
                slit 1 {lab.slits.slit1 ? 'open' : 'closed'}
              </button>
              <button className={`chip ${lab.slits.slit2 ? 'on' : ''}`} onClick={() => { lab.setSlits({ slit2: !lab.slits.slit2 }); touch() }}>
                slit 2 {lab.slits.slit2 ? 'open' : 'closed'}
              </button>
            </div>
          </>
        )}

        {Object.keys(lab.readout).length > 0 && (
          <div className="lab-readout">
            {Object.entries(lab.readout).map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
          </div>
        )}
      </aside>
    </>
  )
}
