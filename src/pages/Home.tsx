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
  // The interactive lab needs both a GPU context and a visitor who wants motion.
  const showLab = !reducedMotion && webglOk
  const total = projects.length
  const prodCount = projects.filter((p) => p.status === 'production').length
  const shown = projects.slice(0, revealed)

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
          <LabFallback reason={webglOk ? 'motion' : 'webgl'} />
        )}
        <div className="hero-copy">
          <div className="hero-kicker">// mission control · {profile.name}</div>
          <h1 className="hero-title">
            I build AI systems<br />that <span className="at">answer the phone</span>.
          </h1>
          <p className="hero-sub">
            {profile.role} @ {profile.company}, previously {profile.previous.title} at {profile.previous.org} —
            where most of these systems were built: voice agents on real phone lines, streaming ML pipelines,
            and the observability that keeps them honest.{showLab ? ' The lab beside you is real physics — drag the pendulum.' : ' The trace beside you is a real double pendulum, integrated and drawn without a GPU.'}
          </p>
          <div className="hero-cta">
            <button className="btn" onClick={openArchive}>Open the archive ↓</button>
            <button className="btn ghost" onClick={() => setTermOpen(true)}>Launch terminal</button>
          </div>
          <div className="hero-hint">
            <kbd>`</kbd> opens the shell · <kbd>ls</kbd> declassifies projects · nothing is shown until you ask
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
            <div className="metric"><div className="v">400+</div><div className="l">agents on my usage telemetry</div></div>
            <div className="metric"><div className="v">99.4%</div><div className="l">call-audit checklist accuracy</div></div>
            <div className="metric"><div className="v">{total}</div><div className="l">hands-on sandboxes on this site</div></div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>Trajectory</h2>
            <span className="path">cat ~/career.log</span>
            <span className="spacer" />
            <Link to="/about" className="mono-note" style={{ color: 'var(--accent)' }}>full timeline →</Link>
          </div>
          <Trajectory items={profile.experience.filter((e) => e.kind === 'work' || e.kind === 'education').slice().reverse()} />
        </section>

        <section className="sec" id="archive">
          <div className="archive">
            <div className="archive-head">
              <span className={`lock ${revealed > 0 ? 'open' : ''}`} aria-hidden>{revealed > 0 ? '🔓' : '🔒'}</span>
              <h2>Project archive</h2>
              <span className="count">{revealed}/{total} systems declassified</span>
              <div className="actions">
                {revealed < total && (
                  <button className="btn small" onClick={() => reveal(revealed + REVEAL_STEP, total)}>
                    ▸ {revealed === 0 ? `declassify ${REVEAL_STEP} systems` : `reveal ${Math.min(REVEAL_STEP, total - revealed)} more`}
                  </button>
                )}
                {revealed > 0 && revealed < total && (
                  <button className="btn small ghost" onClick={() => reveal(total, total)}>reveal all</button>
                )}
                {revealed >= total && <Link className="btn small ghost" to="/projects">open the full index →</Link>}
              </div>
            </div>
            <div className="archive-body">
              {revealed === 0 ? (
                <div className="archive-empty">
                  <div>Nothing here is shown proactively. Two ways in:</div>
                  <div>▸ the button above, or</div>
                  <div>▸ open the terminal (<code>`</code>) and run <code>ls</code> — <code>ls --all</code> reveals everything</div>
                  <div className="archive-redacted" aria-hidden>
                    {[0, 1, 2].map((i) => <div className="redacted" key={i}>REDACTED</div>)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid">
                    {shown.map((p, i) => <ProjectCard key={p.slug} p={p} index={i} animate />)}
                  </div>
                  {revealed < total && (
                    <div className="archive-foot">
                      <span className="mono-note">{total - revealed} still classified · <code style={{ color: 'var(--accent)' }}>ls --all</code> in the terminal reveals the rest</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-head">
            <h2>How this site works</h2>
            <span className="path">cat README.md</span>
          </div>
          <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div className="panel">
              <h2><span className="ico">▸</span> Every project is playable</h2>
              <p>
                Each project page ships a <b style={{ color: 'var(--accent)' }}>sandbox</b>: a small, honest,
                in-browser simulation of the real system — a fraud model you can feed transactions, a Grafana
                dashboard you can overload, a voice-agent call you can derail. Next to it: why, what, stack, numbers, when.
              </p>
            </div>
            <div className="panel">
              <h2><span className="ico">▸</span> The lab is real physics</h2>
              <p>
                The double pendulum integrates its Lagrangian equations with RK4 at 240 Hz; the ghosts start
                a thousandth of a radian apart. The double slit is a ripple tank in a vertex shader and the
                fringes on the screen are the analytic <b style={{ color: 'var(--accent)' }}>cos²</b> pattern. Try <b style={{ color: 'var(--accent)' }}>lab slits</b> in the shell.
              </p>
            </div>
            <div className="panel">
              <h2><span className="ico">▸</span> It's a game, quietly</h2>
              <p>
                Revealing systems, running commands and poking sandboxes earns XP, levels and achievements.
                Try <b style={{ color: 'var(--accent)' }}>theme light</b>, <b style={{ color: 'var(--accent)' }}>theme dim</b>, then <b style={{ color: 'var(--accent)' }}>sudo hire-me</b>.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
