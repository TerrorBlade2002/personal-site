import { Suspense, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { bySlug, projects, CATEGORY_LABELS } from '../data/projects'
import { useApp } from '../store/appStore'
import { SANDBOXES } from '../sandboxes/registry'

export default function ProjectDetail() {
  const { slug } = useParams()
  const p = slug ? bySlug[slug] : undefined
  const visitProject = useApp((s) => s.visitProject)

  useEffect(() => {
    if (p) visitProject(p.slug, projects.length)
  }, [p, visitProject])

  if (!p) {
    return (
      <main className="page">
        <div className="empty-state">
          <div className="big">404</div>
          <div>No such project. <Link to="/projects">Back to projects</Link></div>
        </div>
      </main>
    )
  }

  const idx = projects.findIndex((x) => x.slug === p.slug)
  const prev = projects[(idx - 1 + projects.length) % projects.length]
  const next = projects[(idx + 1) % projects.length]
  const Sandbox = SANDBOXES[p.sandbox]

  return (
    <main className="page" style={{ '--card-c': p.color } as React.CSSProperties}>
      <div className="detail-head">
        <div className="detail-breadcrumb">
          <Link to="/projects">Projects</Link> / {p.slug}
        </div>
        <h1>{p.name}</h1>
        <p className="tagline">{p.tagline}</p>
        <div className={`detail-facts status-${p.status}`}>
          <span><span className="status-dot" />status: <b>{p.status}</b></span>
          <span>built: <b>{p.period}</b></span>
          <span>domain: <b>{CATEGORY_LABELS[p.category]}</b></span>
          <span>file: <b style={{ color: p.color }}>{p.codename}</b></span>
        </div>
        <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 18 }}>
          <a className="btn" href={p.repo} target="_blank" rel="noreferrer">Source on GitHub ↗</a>
          <a className="btn ghost" href="#sandbox">Try the demo ⌄</a>
        </div>
      </div>

      <div className="detail-cols">
        <div className="sb-col">
          <div className="panel">
            <h2><span className="ico">?</span> Why it was built</h2>
            <p>{p.why}</p>
          </div>
          <div className="panel">
            <h2><span className="ico">▸</span> What it does</h2>
            <ul>{p.what.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
          <div className="panel">
            <h2><span className="ico">⇄</span> How the production system works</h2>
            <div className="pipe">
              {p.pipeline.map((s, i) => (
                <div className="pipe-step" key={i}>
                  <div className="pipe-num">{i + 1}</div>
                  <div className="pipe-body"><b>{s.stage}</b><span>{s.detail}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sb-col">
          <div className="panel">
            <h2><span className="ico">#</span> Numbers</h2>
            <div className="metrics" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {p.numbers.map((m) => (
                <div className="metric" key={m.label}>
                  <div className="v" style={{ color: p.color }}>{m.value}</div>
                  <div className="l">{m.label}</div>
                  {m.hint && <div className="h">{m.hint}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2><span className="ico">⚙</span> Stack</h2>
            <div className="tag-row">
              {p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}
            </div>
          </div>
        </div>
      </div>

      <section className="sec" id="sandbox">
        <div className="sec-head">
          <h2>Interactive demo</h2>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: -10 }}>{p.sandboxPitch}</p>
        <Suspense fallback={<div className="sandbox"><div className="sandbox-body mono-note">loading…</div></div>}>
          <Sandbox />
        </Suspense>
      </section>

      <div className="pager" style={{ justifyContent: 'space-between' }}>
        <Link className="btn ghost small" to={`/projects/${prev.slug}`}>← {prev.name}</Link>
        <Link className="btn ghost small" to="/projects">All projects</Link>
        <Link className="btn ghost small" to={`/projects/${next.slug}`}>{next.name} →</Link>
      </div>
    </main>
  )
}
