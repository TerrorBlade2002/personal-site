import { Link } from 'react-router-dom'
import type { Project } from '../data/projects'
import { CATEGORY_LABELS } from '../data/projects'
import { REVEAL_STEP, useApp } from '../store/appStore'

export default function ProjectCard({ p, index = 0, animate = false }: { p: Project; index?: number; animate?: boolean }) {
  const visited = useApp((s) => s.visited.includes(p.slug))
  const style: React.CSSProperties = { '--card-c': p.color } as React.CSSProperties
  if (animate) style.animationDelay = `${(index % REVEAL_STEP) * 110}ms`
  return (
    <Link to={`/projects/${p.slug}`} className={`card ${animate ? 'decrypt' : ''}`} style={style}>
      {visited && <span className="visited-tick" title="visited">✓ visited</span>}
      <div className="card-top">
        <span className="card-codename">{p.codename}</span>
        <span>·</span>
        <span>{CATEGORY_LABELS[p.category]}</span>
      </div>
      <h3>{p.name}</h3>
      <p>{p.tagline}</p>
      <div className="tag-row">
        {p.tags.slice(0, 4).map((t) => <span className="tag" key={t}>{t}</span>)}
      </div>
      <div className={`card-meta status-${p.status}`}>
        <span><span className="status-dot" />{p.status}</span>
        <span>{p.period}</span>
        <span style={{ marginLeft: 'auto', color: p.color }}>Try the demo →</span>
      </div>
    </Link>
  )
}
