import { profile } from '../data/profile'
import { useApp } from '../store/appStore'

export default function Contact() {
  const { setTermOpen } = useApp()
  return (
    <main className="page">
      <div className="sec-head">
        <h2>Open a channel</h2>
        <span className="path">./contact --handshake</span>
      </div>

      <div className="panel" style={{ padding: 30 }}>
        <p className="contact-big">
          Building voice agents, ML pipelines or anything that needs to work at 3am?
          <br />
          <span style={{ color: 'var(--accent)' }}>Let’s talk.</span>
        </p>
        <p style={{ color: 'var(--muted)', maxWidth: 640 }}>
          I answer fastest to concrete problems: a latency budget you can’t hit, a pipeline that
          drops events, an agent that hallucinates its closing line. Bonus points if you mention
          which sandbox you broke.
        </p>

        <div className="contact-methods">
          <a className="contact-card" href={`mailto:${profile.email}?subject=Mission%20Control%20contact`}>
            <div className="k">primary channel · email</div>
            <div className="v">{profile.email}</div>
            <div className="d">best for: work, collabs, interesting problems</div>
          </a>
          <a className="contact-card" href={profile.linkedin} target="_blank" rel="noreferrer">
            <div className="k">career · linkedin</div>
            <div className="v">{profile.linkedinLabel}</div>
            <div className="d">the formal version of the timeline</div>
          </a>
          <a className="contact-card" href={profile.github} target="_blank" rel="noreferrer">
            <div className="k">code · github</div>
            <div className="v">github.com/{profile.handle}</div>
            <div className="d">24 public repos — audit before you email</div>
          </a>
          <button className="contact-card" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }} onClick={() => setTermOpen(true)}>
            <div className="k">for the brave · terminal</div>
            <div className="v">sudo hire-me</div>
            <div className="d">there’s an achievement in it for you</div>
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2><span className="ico">📍</span> Coordinates</h2>
        <div className="sb-kv"><span>current post</span><b>{profile.role} @ {profile.company}</b></div>
        <div className="sb-kv"><span>previously</span><b>{profile.previous.title} @ {profile.previous.org} · {profile.previous.period}</b></div>
        <div className="sb-kv"><span>education</span><b>{profile.education}</b></div>
        <div className="sb-kv"><span>base of operations</span><b>{profile.location} · IST (UTC+5:30) — async-friendly</b></div>
        <div className="sb-kv"><span>response SLA</span><b>faster than my voice agent’s p99</b></div>
      </div>
    </main>
  )
}
