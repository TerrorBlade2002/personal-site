import { useEffect, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { useApp, levelFor, levelProgress, rankFor, type Mode } from '../store/appStore'

const MODE_ICON: Record<Mode, string> = { dark: '☾', dim: '◐', light: '☀' }
const MODE_NEXT: Record<Mode, Mode> = { dark: 'dim', dim: 'light', light: 'dark' }

const LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: '~/home', end: true },
  { to: '/projects', label: '~/projects' },
  { to: '/about', label: '~/about' },
  { to: '/contact', label: '~/contact' },
]

export default function Header() {
  const { xp, termOpen, setTermOpen, mode, cycleMode, hdrCollapsed, setHdrCollapsed } = useApp()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const lvl = levelFor(xp)
  const prog = levelProgress(xp)

  // The mobile menu must never survive a navigation or an Escape press.
  useEffect(() => { setNavOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  // Collapsing the header would hide the open menu with it.
  const collapse = (v: boolean) => { setNavOpen(false); setHdrCollapsed(v) }

  return (
    <header className={`hdr ${hdrCollapsed ? 'collapsed' : ''} ${navOpen ? 'nav-open' : ''}`}>
      <Link to="/" className="hdr-logo">
        <span className="prompt">➜</span>
        <span>arnab@mission-control</span>
        <span className="cursor" aria-hidden />
      </Link>

      {/* Wide screens: inline nav. Narrow: hidden, replaced by the sheet below. */}
      <nav className="hdr-nav">
        {LINKS.map((l) => <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>)}
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
        {/* Narrow screens only — the inline nav has no room there. */}
        <button
          className="nav-toggle"
          data-testid="nav-toggle"
          onClick={() => setNavOpen(!navOpen)}
          aria-expanded={navOpen}
          aria-controls="mobile-nav"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`burger ${navOpen ? 'x' : ''}`} aria-hidden><i /><i /><i /></span>
        </button>
      </div>

      {/* Mobile navigation sheet */}
      <nav id="mobile-nav" className={`hdr-menu ${navOpen ? 'open' : ''}`} data-testid="hdr-menu">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setNavOpen(false)}>{l.label}</NavLink>
        ))}
      </nav>

      {/* Collapse handle: tucks the header away (hover the top edge to peek on
          pointer devices, tap again on touch) so the lab has the full viewport. */}
      <button
        className="hdr-tab"
        data-testid="hdr-tab"
        onClick={(e) => { collapse(!hdrCollapsed); e.currentTarget.blur() }}
        title={hdrCollapsed ? 'pin the header open' : 'collapse the header — hover the top edge to peek'}
        aria-label={hdrCollapsed ? 'expand header' : 'collapse header'}
        aria-expanded={!hdrCollapsed}
      >
        {hdrCollapsed ? '▾' : '▴'}
      </button>
    </header>
  )
}
