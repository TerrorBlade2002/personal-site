import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Experience } from '../data/profile'

const KIND_COLOR: Record<Experience['kind'], string> = {
  work: 'var(--accent)',
  education: 'var(--violet)',
  award: 'var(--amber)',
  project: 'var(--green)',
}
const KIND_LABEL: Record<Experience['kind'], string> = {
  work: 'work',
  education: 'education',
  award: 'award',
  project: 'independent work',
}

function Item({ e }: { e: Experience }) {
  const [all, setAll] = useState(false)
  const bullets = e.bullets ?? []
  const shown = all ? bullets : bullets.slice(0, 3)
  return (
    <div className="tl-item" style={{ '--tl-c': KIND_COLOR[e.kind] } as React.CSSProperties}>
      <div className="tl-when">
        <b>{e.start} — {e.end}</b>
        {e.location && <span>{e.location}</span>}
      </div>
      <div className="tl-axis"><span className={`tl-node ${e.current ? 'current' : ''}`} /></div>
      <article className="tl-card">
        <div className="tl-kind">{KIND_LABEL[e.kind]}{e.current && <span className="tl-now">NOW</span>}</div>
        <h3>{e.title}</h3>
        <div className="tl-org"><b>{e.org}</b></div>
        <p className="tl-sum">{e.summary}</p>
        {shown.length > 0 && <ul className="tl-bullets">{shown.map((b, i) => <li key={i}>{b}</li>)}</ul>}
        {bullets.length > 3 && (
          <button className="tl-more" onClick={() => setAll(!all)}>
            {all ? 'show fewer' : `show all ${bullets.length} highlights`}
          </button>
        )}
        {e.tags && <div className="tag-row tl-tags">{e.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>}
        {e.link && <div style={{ marginTop: 10 }}><Link to={e.link} className="tl-link">{e.linkLabel ?? 'open →'}</Link></div>}
      </article>
    </div>
  )
}

// Full vertical chronology — newest first.
export default function Timeline({ items }: { items: Experience[] }) {
  return <div className="tl">{items.map((e) => <Item key={e.id} e={e} />)}</div>
}

// Compact horizontal strip — oldest → newest.
export function Trajectory({ items }: { items: Experience[] }) {
  return (
    <div className="traj">
      {items.map((e) => (
        <div className="traj-node" key={e.id} style={{ '--traj-c': KIND_COLOR[e.kind] } as React.CSSProperties}>
          <span className={`traj-dot ${e.current ? 'current' : ''}`} />
          <div className="traj-body">
            <div className="k">{e.start} — {e.end}</div>
            <b>{e.org}</b>
            <span>{e.title}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
