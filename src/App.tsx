import { Component, Suspense, lazy, useEffect, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Toasts from './components/Toasts'
import Terminal from './components/terminal/Terminal'
import MatrixRain from './components/MatrixRain'
import { applyThemeToDom, useApp } from './store/appStore'

const Home = lazy(() => import('./pages/Home'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const NotFound = lazy(() => import('./pages/NotFound'))

const STALE_CHUNK = /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch|error loading dynamically/i

// After a deploy, a tab that is still open holds the old index.html and asks
// for chunk hashes that no longer exist. Without a boundary the rejected lazy
// import unmounts the whole tree (blank page until refresh). Here we reload
// once to pick up the new index.html; anything else shows a recoverable panel.
class RouteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    const msg = String(error?.message ?? error)
    if (STALE_CHUNK.test(msg) && !sessionStorage.getItem('mc-reloaded')) {
      sessionStorage.setItem('mc-reloaded', '1')
      window.location.reload()
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <div className="empty-state">
            <div className="big">⚠</div>
            <div>This module failed to load — usually a stale tab after a deploy.</div>
            <p style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => window.location.reload()}>reload mission control</button>
            </p>
            <pre className="mono-note" style={{ whiteSpace: 'pre-wrap', maxWidth: 640, margin: '16px auto 0' }}>{this.state.error.message}</pre>
          </div>
        </main>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { theme, mode, termOpen, setTermOpen, matrixOn, unlock } = useApp()
  const location = useLocation()

  // Braces matter: returning scrollTo()'s result would hand React a non-function
  // "cleanup" (some browsers/extensions make scrollTo return a value) and every
  // route change would throw on unmount.
  useEffect(() => { window.scrollTo(0, 0) }, [location.pathname])

  // Safety net: the store applies these synchronously on change; this keeps
  // the DOM in sync if state is ever rehydrated from another tab.
  useEffect(() => {
    applyThemeToDom(mode, theme)
  }, [mode, theme])

  useEffect(() => {
    unlock('first-contact')
  }, [unlock])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
      if (e.key === '`' && !typing) {
        e.preventDefault()
        setTermOpen(!termOpen)
      }
      if (e.key === 'Escape' && termOpen) setTermOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [termOpen, setTermOpen])

  return (
    <div className="shell crt">
      <Header />
      {/* keyed on the path so a failed route does not poison the next one */}
      <RouteErrorBoundary key={location.pathname}>
        <Suspense fallback={<div className="page mono-note">loading module…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
      <Footer />
      <Terminal />
      <Toasts />
      {matrixOn && <MatrixRain />}
    </div>
  )
}
