import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import './styles/global.css'
import App from './App'
import { applyThemeToDom, useApp } from './store/appStore'

// Theme attributes go on <html> before the first React render (the inline
// script in index.html already did this pre-CSS; this re-asserts from the
// validated store state) and are kept in sync with any later store change,
// including rehydration from another tab.
const { mode, theme } = useApp.getState()
applyThemeToDom(mode, theme)
useApp.subscribe((s, prev) => {
  if (s.mode !== prev.mode || s.theme !== prev.theme) applyThemeToDom(s.mode, s.theme)
})

// Progress lives in localStorage (per browser profile, per origin). If another
// tab of this site changes it, pull the new state in so both tabs agree.
window.addEventListener('storage', (e) => {
  if (e.key === 'mission-control') void useApp.persist.rehydrate()
})

// Stale tab after a deploy: a lazy chunk's hash no longer exists on the host.
// Reload once to fetch the fresh index.html; the RouteErrorBoundary handles
// anything that still fails after that (no reload loops).
window.addEventListener('vite:preloadError', (e) => {
  if (sessionStorage.getItem('mc-reloaded')) return
  e.preventDefault()
  sessionStorage.setItem('mc-reloaded', '1')
  window.location.reload()
})
// A session that has been healthy for a while may auto-recover again later.
setTimeout(() => sessionStorage.removeItem('mc-reloaded'), 15000)

// BrowserRouter gives clean URLs (/projects, not /#/projects). The host must
// serve index.html for unknown paths — public/_redirects does that on
// Cloudflare Pages / Netlify; Vite dev + preview do it natively.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
