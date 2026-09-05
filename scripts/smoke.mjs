// Headless smoke test: drives the built site in Chromium, captures console
// errors and screenshots of the key surfaces (all three color modes, the
// physics lab in both experiments, the archive reveal flow, client-side
// navigation without reloads, header collapse, sandboxes, mobile).
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4321'
const OUT = 'scripts/shots'
mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/arnab/AppData/Local/ms-playwright/chromium_headless_shell-1187/chrome-win/headless_shell.exe',
  headless: true,
  userDataDir: 'C:/personal_site/scripts/.chromium-profile',
  args: ['--no-first-run', '--no-default-browser-check', '--disable-extensions', '--enable-unsafe-swiftshader', '--window-size=1440,900'],
  defaultViewport: { width: 1440, height: 900 },
})

const page = await browser.newPage()
// Mimic browsers/extensions where window.scrollTo returns a value: an effect
// written as `useEffect(() => window.scrollTo(0, 0))` then hands React a
// non-function cleanup and every route change throws. Caught a real bug once.
await page.evaluateOnNewDocument(() => {
  const orig = window.scrollTo.bind(window)
  window.scrollTo = (...args) => { orig(...args); return true }
})
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`) })
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) => {
  // a navigation cancelling an in-flight optional font subset is not a defect
  if (r.failure()?.errorText === 'net::ERR_ABORTED' && /.woff2?$/.test(r.url())) return
  errors.push(`[reqfail] ${r.url()} ${r.failure()?.errorText}`)
})

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const clickText = (txt) => page.$$eval('button', (bs, t) => {
  const b = bs.find((x) => x.textContent.includes(t))
  if (b) { b.click(); return true }
  return false
}, txt)
// full-document navigations use a unique query (HashRouter ignores it) so they
// never race Puppeteer's internal reloads; client-side navigation is tested
// separately below by clicking real links.
const settle = () => page.waitForNetworkIdle({ idleTime: 600, timeout: 25000 }).catch(() => {})
const go = async (path) => { await page.goto(`${BASE}/${path}?t=${Date.now()}`, { waitUntil: 'load', timeout: 90000 }); await settle() }
const reload = async () => { await page.reload({ waitUntil: 'load', timeout: 90000 }); await settle() }
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` })
const attrs = () => page.evaluate(() => ({ mode: document.documentElement.dataset.mode, accent: document.documentElement.dataset.accent }))
const has = (sel) => page.$(sel).then((h) => h !== null)
const check = (label, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures.push(label) }
const failures = []

// ---------- fresh visitor ----------
await go('')
await page.evaluate(() => localStorage.clear())
await reload()
await wait(3500)
await shot('01-home-pendulum-dark')
check('archive hidden on load', await has('.archive-empty'))
check('lab drawer closed on load', await page.$eval('[data-testid="lab-drawer"]', (el) => !el.classList.contains('open')))
check('header expanded on load', await page.$eval('.hdr', (el) => !el.classList.contains('collapsed')))
check('clean URL on home (no hash)', await page.evaluate(() => location.pathname === '/' && location.hash === ''))
check('WebGL present: lab canvas renders', await has('canvas'))
check('WebGL present: no fallback shown', !(await has('[data-testid="lab-fallback"]')))

// ---------- color modes ----------
await page.click('[data-testid="mode-toggle"]')
await wait(900)
check('mode toggle → dim', (await attrs()).mode === 'dim')
await shot('02-home-dim')
await page.click('[data-testid="mode-toggle"]')
await wait(900)
check('mode toggle → light', (await attrs()).mode === 'light')
await shot('03-home-light')

// ---------- lab rail + drawer ----------
await page.click('[data-testid="lab-exp-slits"]')
await wait(2600)
await shot('04-home-slits-light')
await page.click('[data-testid="lab-tune"]')
await wait(500)
check('drawer opens on tune', await page.$eval('[data-testid="lab-drawer"]', (el) => el.classList.contains('open')))
await clickText('slit 2 open')
await wait(1200)
await shot('05-home-slits-one-closed-drawer')
await page.keyboard.press('Escape')
await wait(400)
check('drawer closes on Esc', await page.$eval('[data-testid="lab-drawer"]', (el) => !el.classList.contains('open')))

// ---------- terminal: theme + lab ----------
await page.keyboard.press('`')
await wait(400)
await page.keyboard.type('theme dark', { delay: 10 })
await page.keyboard.press('Enter')
await wait(300)
await page.keyboard.type('lab pendulum', { delay: 10 })
await page.keyboard.press('Enter')
await wait(2200)
check('terminal `theme dark`', (await attrs()).mode === 'dark')

// ---------- reveal flow ----------
await page.keyboard.press('`')
await wait(300)
await page.keyboard.type('ls', { delay: 10 })
await page.keyboard.press('Enter')
await wait(500)
await shot('06-terminal-ls')
await page.keyboard.press('Escape')
await wait(300)
check('`ls` reveals 6 cards', (await page.$$eval('.archive .card', (c) => c.length)) === 6)
await page.evaluate(() => document.querySelector('.traj')?.scrollIntoView({ block: 'center' }))
await wait(500)
await shot('07a-trajectory')
await page.evaluate(() => document.querySelector('#archive')?.scrollIntoView())
await wait(700)
await shot('07-archive-after-ls')
await clickText('reveal 3 more')
await wait(900)
check('reveal 3 more → 9', (await page.$$eval('.archive .card', (c) => c.length)) === 9)
await clickText('reveal all')
await wait(900)
check('reveal all → 16', (await page.$$eval('.archive .card', (c) => c.length)) === 16)

// ---------- persistence: progress survives reload, archive does not ----------
const xpBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('mission-control')).state.xp)
await reload()
await wait(1500)
check('archive hidden again after reload', await has('.archive-empty'))
check('theme persisted after reload', (await attrs()).mode === 'dark')
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('mission-control')))
check('xp persisted after reload', stored.state.xp === xpBefore && xpBefore > 0)
check('persisted payload is versioned', stored.version === 1)
check('archive reveal is NOT persisted', stored.state.revealed === undefined)

// ---------- client-side navigation (no reloads) ----------
await page.click('.hdr-nav a[href="/projects"]')
await wait(1000)
check('nav link → projects renders', await has('.filter-bar'))
await page.click('.card')
await wait(1000)
check('card click → project detail renders', await has('.detail-head'))
await page.$$eval('a.btn.small', (as) => as.find((a) => /→$/.test(a.textContent.trim()))?.click())
await wait(1000)
check('next-project link renders', await page.$eval('.detail-head h1', (h) => h.textContent.length > 0))
await page.click('.hdr-nav a[href="/about"]')
await wait(900)
check('nav link → about renders timeline', await has('.tl'))
check('timeline has 5 entries', (await page.$$eval('.tl-item', (n) => n.length)) === 5)
await shot('10b-about-timeline')
await page.click('.hdr-nav a[href="/contact"]')
await wait(800)
check('nav link → contact renders', await has('.contact-methods'))
await page.keyboard.press('`')
await wait(300)
await page.keyboard.type('open vta-monitoring', { delay: 10 })
await page.keyboard.press('Enter')
await wait(1200)
check('terminal `open` → detail', (await page.$eval('.detail-head h1', (h) => h.textContent)).includes('VTA Observability'))
await page.click('.hdr-logo')
await wait(1800)
check('logo → home renders hero', await has('.hero'))

// ---------- collapsible header ----------
await page.click('[data-testid="hdr-tab"]')
await wait(500)
check('header collapses on tab click', await page.$eval('.hdr', (el) => el.classList.contains('collapsed')))
await page.mouse.move(700, 600)
await wait(400)
await shot('12-header-collapsed')
const hidden = await page.$eval('.hdr', (el) => getComputedStyle(el).transform)
await page.hover('[data-testid="hdr-tab"]')
await wait(450)
const peeked = await page.$eval('.hdr', (el) => getComputedStyle(el).transform)
check('collapsed header is translated up', hidden !== 'none')
check('collapsed header peeks on hover', peeked === 'none' || peeked === 'matrix(1, 0, 0, 1, 0, 0)')
await page.click('[data-testid="hdr-tab"]')
await wait(400)
check('header pins open again', await page.$eval('.hdr', (el) => !el.classList.contains('collapsed')))

// ---------- sandboxes ----------
await go('projects/fraud-detection')
await wait(800)
await page.evaluate(() => document.querySelector('#sandbox')?.scrollIntoView())
await clickText('consume orders topic')
await wait(3000)
check('fraud stream scores transactions', (await page.$$eval('.sb-log span', (s) => s.length)) >= 2)
await shot('08-fraud-sandbox-dark')
await page.click('[data-testid="mode-toggle"]')
await page.click('[data-testid="mode-toggle"]')
await wait(600)
await shot('09-fraud-sandbox-light')

await go('projects/vta-monitoring')
await wait(700)
await clickText('start call traffic')
await wait(2600)
check('monitor emits call events', (await page.$$eval('.sb-log span', (s) => s.length)) >= 2)

await go('projects/book-recommender')
await wait(700)
await page.type('.sb-input', 'a story about forgiveness', { delay: 5 })
await wait(400)
check('book search ranks results', (await page.$$eval('.sandbox .grid > div', (d) => d.length)) >= 3)

await go('projects/call-audit-supervisor')
await wait(700)
await clickText('run the judge')
await wait(4500)
check('audit judge emits 6 verdicts', (await page.$$eval('.verdict', (v) => v.length)) === 6)

await go('projects/ecomm')
await wait(700)
await clickText('+ add')
await wait(300)
await clickText('checkout')
await wait(400)
check('ecomm checkout confirms an order', await page.$$eval('.t-ok', (t) => t.some((x) => x.textContent.includes('ORD-'))))

await go('projects/virtual-transfer-agent')
await wait(700)
await clickText('cooperative caller')
await wait(9800) // the scripted call takes ~9s to reach its disposition
check('voice call sim logs disposition', await page.$$eval('.sb-log span', (t) => t.some((x) => x.textContent.includes('disposition: verified'))))

await go('projects')
await wait(600)
await shot('10-projects-light')
await go('nope')
await wait(500)
check('404 route renders', await page.$eval('.empty-state', (e) => e.textContent.includes('uncharted')))

// ---------- progress reset via terminal ----------
await go('')
await wait(800)
await page.keyboard.press('`')
await wait(300)
await page.keyboard.type('stats --reset', { delay: 10 })
await page.keyboard.press('Enter')
await wait(500)
check('`stats --reset` wipes xp', (await page.evaluate(() => JSON.parse(localStorage.getItem('mission-control')).state.xp)) <= 27)
await page.keyboard.press('Escape')

// ---------- mobile ----------
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
await page.waitForNetworkIdle({ idleTime: 600, timeout: 15000 }).catch(() => {})
await go('')
await wait(3000)
await shot('11-home-mobile')
check('mobile: lab rail present, drawer closed', (await has('[data-testid="lab-rail"]')) && (await page.$eval('[data-testid="lab-drawer"]', (el) => !el.classList.contains('open'))))
check('mobile: inline nav hidden', await page.$eval('.hdr-nav', (el) => getComputedStyle(el).display === 'none'))
check('mobile: hamburger visible', await page.$eval('[data-testid="nav-toggle"]', (el) => el.offsetParent !== null))
check('mobile: menu closed on load', await page.$eval('[data-testid="hdr-menu"]', (el) => !el.classList.contains('open')))
check('mobile: no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
check('mobile: collapse tab is touch-sized', await page.$eval('.hdr-tab', (el) => el.getBoundingClientRect().height >= 24))
await page.click('[data-testid="nav-toggle"]')
await wait(600)
check('mobile: menu opens with all 4 routes', await page.$$eval('[data-testid="hdr-menu"] a', (as) => as.length === 4 && as.every((a) => a.getBoundingClientRect().height >= 40)))
await shot('11b-mobile-menu-open')
await page.evaluate(() => [...document.querySelectorAll('[data-testid="hdr-menu"] a')].find((a) => a.getAttribute('href') === '/about').click())
await wait(1200)
check('mobile: menu link navigates', await page.evaluate(() => location.pathname === '/about'))
check('mobile: menu auto-closes after navigating', await page.$eval('[data-testid="hdr-menu"]', (el) => !el.classList.contains('open')))
check('mobile: destination rendered', await has('.tl'))
await page.click('[data-testid="hdr-tab"]')
await wait(600)
check('mobile: header collapses on tap (no hover needed)', await page.$eval('.hdr', (el) => el.classList.contains('collapsed')))
await page.click('[data-testid="hdr-tab"]')
await wait(600)
check('mobile: header expands again on tap', await page.$eval('.hdr', (el) => !el.classList.contains('collapsed')))

// ---------- clean-URL deep links (SPA fallback / server rewrite) ----------
await page.setViewport({ width: 1440, height: 900, isMobile: false, hasTouch: false })
await page.waitForNetworkIdle({ idleTime: 600, timeout: 15000 }).catch(() => {})
await go('projects/livekit-worker')
await wait(900)
check('deep link /projects/<slug> loads directly', (await page.$eval('.detail-head h1', (h) => h.textContent)).includes('LiveKit'))
check('deep-link URL is clean', await page.evaluate(() => location.pathname === '/projects/livekit-worker' && location.hash === ''))
await go('about')
await wait(700)
check('deep link /about loads directly', await has('.tl'))

// ---------- WebGL unavailable: static fallback, page still usable ----------
const noGl = await browser.newPage()
await noGl.evaluateOnNewDocument(() => {
  const orig = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (String(type).startsWith('webgl')) return null
    return orig.call(this, type, ...rest)
  }
})
const glErrors = []
noGl.on('pageerror', (e) => glErrors.push(e.message))
await noGl.goto(BASE + '/?nogl=' + Date.now(), { waitUntil: 'load', timeout: 90000 })
await noGl.waitForNetworkIdle({ idleTime: 600, timeout: 20000 }).catch(() => {})
await wait(1200)
check('no-WebGL: static fallback renders', (await noGl.$('[data-testid="lab-fallback"]')) !== null)
check('no-WebGL: no dead canvas left behind', (await noGl.$('canvas')) === null)
check('no-WebGL: lab rail hidden', (await noGl.$('[data-testid="lab-rail"]')) === null)
check('no-WebGL: 3 real physics traces drawn', (await noGl.$$eval('.hero-fallback polyline', (p) => p.length)) === 3)
check('no-WebGL: hero copy still renders', (await noGl.$eval('.hero-title', (h) => h.textContent)).includes('AI systems'))
check('no-WebGL: navigation still works', await (async () => {
  await noGl.click('.hdr-nav a[href="/projects"]')
  await wait(900)
  return (await noGl.$('.filter-bar')) !== null
})())
check('no-WebGL: zero page errors', glErrors.length === 0)
await noGl.goto(BASE + '/?nogl2=' + Date.now(), { waitUntil: 'load', timeout: 90000 })
await wait(1500)
await noGl.screenshot({ path: OUT + '/13-no-webgl-fallback.png' })
await noGl.close()

console.log(`\n=== ${failures.length} FAILURES, ${errors.length} ERRORS ===`)
failures.forEach((f) => console.log('  ✗', f))
errors.slice(0, 20).forEach((e) => console.log(e))
await browser.close()
process.exit(failures.length || errors.length ? 1 : 0)
