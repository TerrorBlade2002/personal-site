import { Suspense, lazy, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import { profile } from '../data/profile'
import ProjectCard from '../components/ProjectCard'
import LabControls from '../components/LabControls'
import LabFallback from '../components/LabFallback'
import { hasWebGL } from '../lib/webgl'
import { Trajectory } from '../components/Timeline'
import { REVEAL_STEP, useApp } from '../store/appStore'

// The three.js bundle only loads for the lab — the rest of the site never pays for it.
const PhysicsLab = lazy(() => import('../three/PhysicsLab'))

export default function Home() {
  const { setTermOpen, revealed, reveal } = useApp()
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const webglOk = useMemo(() => hasWebGL(), [])
  const showLab = !reducedMotion && webglOk
  const total = projects.length
  const prodCount = projects.filter((p) => p.status === 'production').length
  const shown = projects.slice(0, revealed)
  const remaining = total - revealed

  const openArchive = () => {
    reveal(Math.max(revealed, REVEAL_STEP), total)
    document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="page-full">
      <section className="hero">
        {showLab ? (
          <Suspense fallback={<div className="hero-canvas" />}>
            <PhysicsLab />
          </Suspense>
        ) : (
          <LabFallback />
        )}
        <div className="hero-copy">
          <div className="hero-kicker">{profile.fullName} · {profile.role}, {profile.company}</div>
          <h1 className="hero-title">
            I build AI systems that<br />
            <span className="at">survive production</span><br />
            and scale with it.
          </h1>
          <p className="hero-sub">
            Previously {profile.previous.title} at {profile.previous.org}: voice agents on live phone
            lines, streaming ML pipelines, and the observability that keeps them honest.
          </p>
          <div className="hero-cta">
            <button className="btn" onClick={openArchive}>View projects</button>
            <button className="btn ghost" onClick={() => setTermOpen(true)}>Open terminal</button>
          </div>
        </div>
        {showLab && <LabControls />}
        <div className="hero-scroll" aria-hidden>▾</div>
      </section>

      <div className="page" style={{ paddingTop: 30 }}>
        <section className="sec" style={{ marginTop: 0 }}>
          <div className="metrics">
            <div className="metric"><div className="v">{prodCount}</div><div className="l">systems in production</div></div>
            <div className="metric"><div className="v">p95 1.1s</div><div className="l">voice agent end-of-turn latency</div></div>
            <div className="metric"><div className="v">400+</div><div className="l">users on the usage telemetry</div></div>
            <div className="metric"><div className="v">99.4%</div><div className="l">call-audit checklist accuracy</div></div>
            <div className="metric"><div className="v">{total}</div><div className="l">interactive demos</div></div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Trajectory</h2>
            <span className="spacer" />
            <Link to="/about" className="sec-link">Full timeline →</Link>
          </div>
          <Trajectory items={profile.experience.filter((e) => e.kind === 'work' || e.kind === 'education').slice().reverse()} />
        </section>

        <section className="sec" id="archive">
          <div className="archive">
            <div className="archive-head">
              <h2>Selected work</h2>
              <span className="count">{revealed} of {total}</span>
              <div className="actions">
                {revealed > 0 && revealed < total && (
                  <>
                    <button className="btn small" onClick={() => reveal(revealed + REVEAL_STEP, total)}>
                      Show {Math.min(REVEAL_STEP, remaining)} more
                    </button>
                    <button className="btn small ghost" onClick={() => reveal(total, total)}>Show all</button>
                  </>
                )}
                {revealed >= total && <Link className="btn small ghost" to="/projects">Browse with filters →</Link>}
              </div>
            </div>
            <div className="archive-body">
              {revealed === 0 ? (
                <div className="archive-empty">
                  <div className="placeholders" aria-hidden>
                    {[0, 1, 2].map((i) => <div className="placeholder" key={i} />)}
                  </div>
                  <button className="btn placeholder-cta" onClick={() => reveal(REVEAL_STEP, total)}>
                    Show projects
                  </button>
                </div>
              ) : (
                <div className="grid">
                  {shown.map((p, i) => <ProjectCard key={p.slug} p={p} index={i} animate />)}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
