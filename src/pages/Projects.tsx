import { useMemo, useState } from 'react'
import { projects, CATEGORY_LABELS, type Category } from '../data/projects'
import ProjectCard from '../components/ProjectCard'

const PAGE_SIZE = 6
const CATS = Object.keys(CATEGORY_LABELS) as Category[]

export default function Projects() {
  const [cat, setCat] = useState<Category | 'all'>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return projects.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (!needle) return true
      return [p.name, p.tagline, p.slug, ...p.tags, ...p.stack].join(' ').toLowerCase().includes(needle)
    })
  }, [cat, q])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pages)
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <main className="page">
      <div className="sec-head">
        <h2>Projects</h2>
        <span className="path">{projects.length} systems</span>
      </div>

      <div className="filter-bar">
        <input
          className="search"
          placeholder="Search name, tag or stack…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          aria-label="search projects"
        />
        <button className={`chip ${cat === 'all' ? 'on' : ''}`} onClick={() => { setCat('all'); setPage(1) }}>
          All ({projects.length})
        </button>
        {CATS.map((c) => {
          const n = projects.filter((p) => p.category === c).length
          return (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => { setCat(c); setPage(1) }}>
              {CATEGORY_LABELS[c]} ({n})
            </button>
          )
        })}
      </div>

      {slice.length === 0 ? (
        <div className="empty-state">
          <div>No matches.</div>
        </div>
      ) : (
        <div className="grid">
          {slice.map((p) => <ProjectCard key={p.slug} p={p} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="pager">
          <button disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>←</button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} className={safePage === i + 1 ? 'on' : ''} onClick={() => setPage(i + 1)}>
              {i + 1}
            </button>
          ))}
          <button disabled={safePage === pages} onClick={() => setPage(safePage + 1)}>→</button>
          <span className="info">page {safePage} of {pages} · {filtered.length} projects</span>
        </div>
      )}
    </main>
  )
}
