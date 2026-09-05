import { useEffect, useState } from 'react'
import { EXPERIMENT_META, useLab } from '../store/labStore'
import { useApp } from '../store/appStore'

// Physics-lab controls: a slim icon rail docked to the right edge of the hero
// (experiment switch, pause, reset, randomize, tune) and a drawer that slides
// out beside it on demand for the sliders and readouts. Closed by default so
// the scene and the hero copy stay unobstructed.

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

export default function LabControls() {
  const lab = useLab()
  const unlock = useApp((s) => s.unlock)
  const [open, setOpen] = useState(false)
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

  const togglePause = () => {
    if (isPendulum) lab.setPendulum({ paused: !lab.pendulum.paused })
    else lab.setSlits({ paused: !lab.slits.paused })
    touch()
  }

  return (
    <>
      <div className="lab-rail" data-testid="lab-rail" role="toolbar" aria-label="physics lab controls">
        <span className="lab-rail-label">LAB</span>
        <button
          className={`rail-btn ${isPendulum ? 'on' : ''}`}
          data-tip="Double pendulum"
          data-testid="lab-exp-pendulum"
          aria-pressed={isPendulum}
          onClick={() => { lab.setExperiment('pendulum'); touch() }}
        ><PendulumIcon /></button>
        <button
          className={`rail-btn ${!isPendulum ? 'on' : ''}`}
          data-tip="Young's double slit"
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
          <button className="rail-btn" data-tip="Randomize start" onClick={() => { lab.randomize(); touch() }} aria-label="randomize">⚄</button>
        )}
        <i className="rail-sep" />
        <button
          className={`rail-btn ${open ? 'on' : ''}`}
          data-tip={open ? 'Close controls' : 'Tune parameters'}
          data-testid="lab-tune"
          aria-expanded={open}
          onClick={() => { setOpen(!open); touch() }}
        >⚙</button>
      </div>

      <aside className={`lab-drawer ${open ? 'open' : ''}`} data-testid="lab-drawer" aria-hidden={!open}>
        <div className="lab-drawer-head">
          <span className="badge">PHYSICS LAB</span>
          <b>{meta.name}</b>
          <button className="close" onClick={() => setOpen(false)} aria-label="close controls">✕</button>
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
            <div className="mono-note">drag either bob · drag empty space to orbit</div>
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
            <div className="mono-note">drag to orbit · the far screen shows the fringes</div>
          </>
        )}

        {Object.keys(lab.readout).length > 0 && (
          <div className="lab-readout">
            {Object.entries(lab.readout).map(([k, v]) => <span key={k}>{k} <b>{v}</b></span>)}
          </div>
        )}
        <div className="mono-note">shell: <span style={{ color: 'var(--accent)' }}>lab {isPendulum ? 'slits' : 'pendulum'}</span> · <span style={{ color: 'var(--accent)' }}>lab reset</span> · Esc closes</div>
      </aside>
    </>
  )
}
