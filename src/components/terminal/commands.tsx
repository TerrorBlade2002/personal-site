import type { ReactNode } from 'react'
import { projects, bySlug, CATEGORY_LABELS } from '../../data/projects'
import { profile } from '../../data/profile'
import { ACHIEVEMENTS, ACCENTS, MODES, levelFor, rankFor, type Accent, type Mode } from '../../store/appStore'
import { EXPERIMENTS, EXPERIMENT_META, type Experiment } from '../../store/labStore'

export type Ctx = {
  navigate: (path: string) => void
  closeTerm: () => void
  setTheme: (t: Accent) => void
  setMode: (m: Mode) => void
  setMatrix: (v: boolean) => void
  unlock: (id: string) => void
  addXp: (n: number) => void
  reveal: (n: number) => void
  resetProgress: () => void
  lab: {
    experiment: Experiment
    setExperiment: (e: Experiment) => void
    reset: () => void
    randomize: () => void
  }
  state: {
    xp: number; unlocked: string[]; visited: string[]; commandCount: number; sandboxesTouched: string[]
    theme: Accent; mode: Mode; revealed: number
  }
}

export const COMMAND_NAMES = [
  'help', 'ls', 'reveal', 'open', 'cd', 'cat', 'whoami', 'neofetch', 'projects', 'skills',
  'contact', 'socials', 'stats', 'achievements', 'theme', 'mode', 'lab', 'matrix', 'sudo',
  'coffee', 'echo', 'date', 'pwd', 'clear', 'history', 'banner', 'exit',
]

export const AUTOCOMPLETE_TARGETS = [
  ...COMMAND_NAMES,
  ...projects.map((p) => p.slug),
  'about.md', 'skills.json', 'contact.txt', 'home', 'about', 'contact',
  ...ACCENTS, ...MODES, 'hire-me', '--all', ...EXPERIMENTS, 'reset', 'random',
]

// Clean URLs: "are we on the landing page?" is a pathname test now.
const onHome = () => window.location.pathname === '/'

const Row = ({ k, v }: { k: string; v: string }) => (
  <>
    <span className="t-acc">{k}</span>
    <span className="t-dim">{v}</span>
  </>
)

function Help() {
  const rows: [string, string][] = [
    ['help', 'this menu'],
    ['ls [--all]', 'list projects (also shows them on the home page)'],
    ['reveal <n|all>', 'show n more projects on the home page'],
    ['open <slug>', 'jump to a project (try: open fraud-detection)'],
    ['cat <file>', 'read about.md · skills.json · contact.txt · any codename'],
    ['whoami / neofetch', 'operator identity card'],
    ['projects --cat <c>', 'filter by voice-ai · ml · observability · automation · fullstack · data'],
    ['skills', 'stack inventory'],
    ['contact / socials', 'how to reach me'],
    ['lab <pendulum|slits|reset|random>', 'control the scene on the home page'],
    ['theme <dark|dim|light>', 'switch color mode (also: mode <…>)'],
    ['theme <cyan|green|amber|violet|pink>', 'switch accent'],
    ['stats [--reset] / achievements', 'your XP, rank, trophies (--reset wipes progress in this browser)'],
    ['matrix', '…you know what this does'],
    ['sudo hire-me', 'escalate privileges'],
    ['clear / exit', 'housekeeping'],
  ]
  return (
    <div>
      <div className="t-grn">MISSION CONTROL SHELL — available commands</div>
      <div className="term-table">{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</div>
      <div className="t-dim">tip: Tab autocompletes, ↑/↓ recalls history. Every new command earns XP.</div>
    </div>
  )
}

function Ls({ ctx, all }: { ctx: Ctx; all: boolean }) {
  return (
    <div>
      <div className="t-dim">total {projects.length} systems{all ? ' · all shown on the home page' : ` · ${Math.min(projects.length, Math.max(ctx.state.revealed, 6))} shown on the home page (ls --all for everything)`}</div>
      {projects.map((p) => (
        <div key={p.slug}>
          <span className="t-dim">{p.started}  </span>
          <button className="term-link" onClick={() => { ctx.navigate(`/projects/${p.slug}`); ctx.closeTerm() }}>
            {p.slug}
          </button>
          <span className="t-dim"> — {p.tagline.slice(0, 64)}…</span>
        </div>
      ))}
    </div>
  )
}

function Neofetch({ ctx }: { ctx: Ctx }) {
  const art = [
    '      ▄▄▄▄▄      ',
    '   ▄█▀▀   ▀▀█▄   ',
    '  ██   ▄▄▄   ██  ',
    '  ██  █▀ ▀█  ██  ',
    '  ▀█▄ ▀▄▄▄▀ ▄█▀  ',
    '    ▀▀▄▄▄▄▄▀▀    ',
  ]
  const lvl = levelFor(ctx.state.xp)
  const info: [string, string][] = [
    ['user', `${profile.name.toLowerCase()}@${profile.company.toLowerCase().replace(' ', '-')}`],
    ['role', `${profile.role} @ ${profile.company}`],
    ['prev', `${profile.previous.title} @ ${profile.previous.org} (${profile.previous.period})`],
    ['edu', profile.education],
    ['loc', profile.location],
    ['os', 'MissionControl v1.1 (static, CDN-native)'],
    ['shell', 'mc-sh 1.1'],
    ['theme', `${ctx.state.mode} / ${ctx.state.theme}`],
    ['uptime', `${new Date().getFullYear() - 2021} years shipping`],
    ['systems', `${projects.length} documented, ${projects.filter((p) => p.status === 'production').length} in production`],
    ['visitor', `LVL ${lvl} ${rankFor(ctx.state.xp)} · ${ctx.state.xp} xp`],
  ]
  return (
    <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
      <pre className="t-acc" style={{ margin: 0 }}>{art.join('\n')}</pre>
      <div className="term-table" style={{ alignSelf: 'center' }}>
        {info.map(([k, v]) => <Row key={k} k={k} v={v} />)}
      </div>
    </div>
  )
}

const isMode = (s: string): s is Mode => (MODES as readonly string[]).includes(s)
const isAccent = (s: string): s is Accent => (ACCENTS as readonly string[]).includes(s)

export function execute(line: string, ctx: Ctx): ReactNode | 'CLEAR' | 'EXIT' {
  const [cmd, ...args] = line.trim().split(/\s+/)
  const arg = args.join(' ')

  switch (cmd) {
    case 'help': case '?': return <Help />
    case 'ls': case 'dir': {
      const all = args.includes('--all') || args.includes('-a')
      ctx.reveal(all ? projects.length : 6)
      return <Ls ctx={ctx} all={all} />
    }
    case 'reveal': case 'decrypt': case 'declassify': {
      if (arg === 'all' || arg === '--all') {
        ctx.reveal(projects.length)
        if (!onHome()) ctx.navigate('/')
        return <span className="t-grn">all {projects.length} projects shown on the home page</span>
      }
      const n = parseInt(arg || '3', 10)
      if (Number.isNaN(n) || n < 1) return <span className="t-red">reveal: usage — reveal &lt;n|all&gt;</span>
      ctx.reveal(ctx.state.revealed + n)
      if (!onHome()) ctx.navigate('/')
      return <span className="t-grn">{Math.min(projects.length, ctx.state.revealed + n)} of {projects.length} projects shown on the home page</span>
    }
    case 'clear': case 'cls': return 'CLEAR'
    case 'exit': case 'quit': case 'q': return 'EXIT'
    case 'pwd': return <span className="t-dim">/home/arnab/mission-control{window.location.pathname}</span>
    case 'date': return <span className="t-dim">{new Date().toString()}</span>
    case 'echo': return <span>{arg || ''}</span>
    case 'banner':
      return <pre className="t-acc" style={{ margin: 0, fontSize: 11 }}>{String.raw`
   ___  ____  _  _   __   ____
  / __)(  _ \( \( ) / _\ (  _ \
 ( (__  )   / )  ( /    \ ) _ (
  \___)(_)\_)(_)\_)\_/\_/(____/  // mission control`}</pre>

    case 'open': case 'cd': {
      const t = arg.replace(/^~?\//, '').replace(/\/$/, '')
      if (!t || t === '~' || t === 'home') { ctx.navigate('/'); ctx.closeTerm(); return <span className="t-grn">→ ~/home</span> }
      if (t === 'projects') { ctx.navigate('/projects'); ctx.closeTerm(); return <span className="t-grn">→ ~/projects</span> }
      if (t === 'about') { ctx.navigate('/about'); ctx.closeTerm(); return <span className="t-grn">→ ~/about</span> }
      if (t === 'contact') { ctx.navigate('/contact'); ctx.closeTerm(); return <span className="t-grn">→ ~/contact</span> }
      const p = bySlug[t] ?? projects.find((x) => x.codename === t || x.slug.startsWith(t))
      if (p) { ctx.navigate(`/projects/${p.slug}`); ctx.closeTerm(); return <span className="t-grn">→ opening {p.codename}</span> }
      return <span className="t-red">open: no such system: {t}. Try `ls`.</span>
    }

    case 'cat': {
      if (arg === 'about.md') return (
        <div>{profile.about.map((l, i) => <p key={i} style={{ margin: '4px 0' }} className="t-dim">{l}</p>)}</div>
      )
      if (arg === 'skills.json') return <pre style={{ margin: 0, fontSize: 12 }} className="t-dim">{JSON.stringify(profile.skills, null, 1)}</pre>
      if (arg === 'contact.txt') return (
        <div>
          <div>email: <a href={`mailto:${profile.email}`}>{profile.email}</a></div>
          <div>github: <a href={profile.github} target="_blank" rel="noreferrer">{profile.github}</a></div>
          <div>linkedin: <a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedin}</a></div>
          <div className="t-dim">response time: fast for interesting problems</div>
        </div>
      )
      const p = projects.find((x) => x.codename === arg || x.slug === arg)
      if (p) return (
        <div>
          <div className="t-acc">{p.codename} — {p.name}</div>
          <div className="t-dim">{p.tagline}</div>
          <div className="t-dim">period: {p.period} · status: {p.status} · stack: {p.stack.slice(0, 5).join(', ')}</div>
          <button className="term-link" onClick={() => { ctx.navigate(`/projects/${p.slug}`); ctx.closeTerm() }}>open full dossier + sandbox →</button>
        </div>
      )
      return <span className="t-red">cat: {arg || '<file>'}: No such file. Try about.md, skills.json, contact.txt or a codename from `ls`.</span>
    }

    case 'whoami': return (
      <div>
        <div><span className="t-acc">{profile.fullName}</span> — {profile.role} @ {profile.company}, {profile.location}</div>
        <div className="t-dim">previously {profile.previous.title} @ {profile.previous.org} ({profile.previous.period}) · {profile.education}</div>
        <div className="t-dim">{profile.tagline}</div>
      </div>
    )
    case 'neofetch': return <Neofetch ctx={ctx} />

    case 'projects': {
      const catFlag = args.indexOf('--cat')
      const cat = catFlag >= 0 ? args[catFlag + 1] : null
      const list = cat ? projects.filter((p) => p.category === cat) : projects
      if (!list.length) return <span className="t-red">no systems in category '{cat}'. Categories: {Object.keys(CATEGORY_LABELS).join(', ')}</span>
      return (
        <div>
          {list.map((p) => (
            <div key={p.slug}>
              <button className="term-link" onClick={() => { ctx.navigate(`/projects/${p.slug}`); ctx.closeTerm() }}>{p.slug}</button>
              <span className="t-dim"> [{CATEGORY_LABELS[p.category]}] {p.period}</span>
            </div>
          ))}
        </div>
      )
    }

    case 'skills': return (
      <div className="term-table">
        {Object.entries(profile.skills).map(([k, v]) => <Row key={k} k={k} v={v.join(', ')} />)}
      </div>
    )

    case 'contact': case 'socials': return (
      <div>
        <div>📧 <a href={`mailto:${profile.email}`}>{profile.email}</a></div>
        <div>💼 <a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedinLabel}</a></div>
        <div>🐙 <a href={profile.github} target="_blank" rel="noreferrer">github.com/{profile.handle}</a></div>
        <button className="term-link" onClick={() => { ctx.navigate('/contact'); ctx.closeTerm() }}>open ~/contact →</button>
      </div>
    )

    case 'stats': {
      if (args.includes('--reset')) {
        ctx.resetProgress()
        return <span className="t-amb">progress wiped for this browser (localStorage key mission-control). Theme kept.</span>
      }
      const s = ctx.state
      return (
        <div className="term-table">
          <Row k="level" v={`${levelFor(s.xp)} (${rankFor(s.xp)})`} />
          <Row k="xp" v={String(s.xp)} />
          <Row k="commands run" v={String(s.commandCount)} />
          <Row k="systems visited" v={`${s.visited.length}/${projects.length}`} />
          <Row k="systems revealed" v={`${s.revealed}/${projects.length}`} />
          <Row k="sandboxes touched" v={`${s.sandboxesTouched.length}`} />
          <Row k="achievements" v={`${s.unlocked.length}/${ACHIEVEMENTS.length}`} />
        </div>
      )
    }

    case 'achievements': return (
      <div>
        {ACHIEVEMENTS.map((a) => {
          const got = ctx.state.unlocked.includes(a.id)
          return (
            <div key={a.id} className={got ? 't-grn' : 't-dim'}>
              {got ? `${a.icon} ${a.name}` : `🔒 ???`} — {got ? a.desc : 'keep exploring…'}
            </div>
          )
        })}
      </div>
    )

    case 'theme': case 'mode': {
      const t = arg.toLowerCase()
      if (!t) return (
        <div className="term-table">
          <Row k="mode" v={`${ctx.state.mode}   (options: ${MODES.join(' · ')})`} />
          <Row k="accent" v={`${ctx.state.theme}   (options: ${ACCENTS.join(' · ')})`} />
          <Row k="usage" v="theme <mode|accent>" />
        </div>
      )
      if (isMode(t)) { ctx.setMode(t); return <span className="t-grn">console mode → {t}</span> }
      if (isAccent(t)) { ctx.setTheme(t); return <span className="t-grn">accent re-painted → {t}</span> }
      return <span className="t-red">theme: unknown '{t}'. Modes: {MODES.join(' · ')}. Accents: {ACCENTS.join(' · ')}.</span>
    }

    case 'lab': {
      const t = arg.toLowerCase()
      const goHome = () => { if (!onHome()) ctx.navigate('/') }
      if (!t) return (
        <div>
          <div className="t-dim">scene · current: <span className="t-acc">{EXPERIMENT_META[ctx.lab.experiment].name}</span></div>
          {EXPERIMENTS.map((e) => <div key={e}><span className="t-acc">lab {e}</span> <span className="t-dim">— {EXPERIMENT_META[e].blurb}</span></div>)}
          <div><span className="t-acc">lab reset</span> <span className="t-dim">— restore defaults</span> · <span className="t-acc">lab random</span> <span className="t-dim">— random pendulum start</span></div>
        </div>
      )
      if (t === 'reset') { ctx.lab.reset(); goHome(); ctx.unlock('physicist'); return <span className="t-grn">lab reset → defaults</span> }
      if (t === 'random' || t === 'randomize') { ctx.lab.randomize(); goHome(); ctx.unlock('physicist'); return <span className="t-grn">🎲 pendulum re-seeded with random angles</span> }
      const e = (EXPERIMENTS as readonly string[]).includes(t) ? (t as Experiment)
        : t.startsWith('pend') ? 'pendulum' : t.startsWith('slit') || t === 'ydse' || t === 'young' ? 'slits' : null
      if (!e) return <span className="t-red">lab: unknown experiment '{t}'. Try: {EXPERIMENTS.join(' · ')}</span>
      ctx.lab.setExperiment(e)
      ctx.unlock('physicist')
      goHome()
      ctx.closeTerm()
      return <span className="t-grn">→ lab: {EXPERIMENT_META[e].name}</span>
    }

    case 'matrix': ctx.setMatrix(true); return <span className="t-grn">wake up, neo… (click to exit)</span>

    case 'sudo': {
      if (arg === 'hire-me' || arg === 'hire me') {
        ctx.unlock('recruiter-mode')
        ctx.addXp(50)
        return (
          <div>
            <div className="t-grn">[sudo] privileges granted. Deploying resume payload…</div>
            <div>📧 <a href={`mailto:${profile.email}?subject=Let's build something`}>email {profile.name}</a> · 🐙 <a href={profile.github} target="_blank" rel="noreferrer">audit the code first</a></div>
            <div className="t-dim">+50 xp</div>
          </div>
        )
      }
      if (arg.startsWith('rm')) return <span className="t-red">nice try. This portfolio has survived worse than you. (immutable static build)</span>
      return <span className="t-amb">{profile.name.toLowerCase()} is not in the sudoers file. This incident will be reported… to the achievements system.</span>
    }

    case 'rm': return <span className="t-red">rm: read-only filesystem. The only thing you can delete here is your own free time.</span>
    case 'coffee': return <pre className="t-amb" style={{ margin: 0 }}>{String.raw`   ( (
    ) )
  ........
  |      |]   coffee break granted. +0 xp but +100 morale.
  \      /
   '----'`}</pre>
    case 'vim': case 'nano': case 'emacs': return <span className="t-amb">editor wars are out of scope. Try `cat about.md` instead.</span>
    case '': return null
    default:
      return <span className="t-red">{cmd}: command not found. Type `help`.</span>
  }
}
