import { NavLink, Link } from 'react-router-dom'
import { useApp, levelFor, levelProgress, rankFor, type Mode } from '../store/appStore'

const MODE_ICON: Record<Mode, string> = { dark: '☾', dim: '◐', light: '☀' }
const MODE_NEXT: Record<Mode, Mode> = { dark: 'dim', dim: 'light', light: 'dark' }

export default function Header() {
  const { xp, termOpen, setTermOpen, mode, cycleMode, hdrCollapsed, setHdrCollapsed } = useApp()
  const lvl = levelFor(xp)
  const prog = levelProgress(xp)

  return (
    <header className={`hdr ${hdrCollapsed ? 'collapsed' : ''}`}>
      <Link to="/" className="hdr-logo">
        <span className="prompt">➜</span>
        <span>arnab@mission-control</span>
        <span className="cursor" aria-hidden />
      </Link>
      <nav className="hdr-nav">
        <NavLink to="/" end>~/home</NavLink>
        <NavLink to="/projects">~/projects</NavLink>
        <NavLink to="/about">~/about</NavLink>
        <NavLink to="/contact">~/contact</NavLink>
      </nav>
      <div className="hdr-right">
        <div className="xp-chip" title={`Rank: ${rankFor(xp)} — earn XP by exploring projects, running commands and playing with sandboxes`}>
          <span>LVL <b>{lvl}</b></span>
          <span className="xp-bar"><i style={{ width: `${Math.round(prog * 100)}%` }} /></span>
          <span>{xp} xp</span>
        </div>
        <button
          className="mode-btn"
          onClick={cycleMode}
          title={`${mode} mode — click for ${MODE_NEXT[mode]}`}
          aria-label={`Color mode: ${mode}. Switch to ${MODE_NEXT[mode]}`}
          data-testid="mode-toggle"
        >
          {MODE_ICON[mode]}
        </button>
        <button className="term-btn" onClick={() => setTermOpen(!termOpen)}>
          <span>terminal</span>
          <kbd>`</kbd>
        </button>
      </div>
      {/* Collapse handle: tucks the header away (hover the top edge to peek,
          click again to pin it back) so the lab has the full viewport. */}
      <button
        className="hdr-tab"
        data-testid="hdr-tab"
        onClick={(e) => { setHdrCollapsed(!hdrCollapsed); e.currentTarget.blur() }}
        title={hdrCollapsed ? 'pin the header open' : 'collapse the header — hover the top edge to peek'}
        aria-label={hdrCollapsed ? 'expand header' : 'collapse header'}
        aria-expanded={!hdrCollapsed}
      >
        {hdrCollapsed ? '▾' : '▴'}
      </button>
    </header>
  )
}
