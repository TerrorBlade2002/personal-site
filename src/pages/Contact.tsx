import { profile } from '../data/profile'
import { useApp } from '../store/appStore'

export default function Contact() {
  const { setTermOpen } = useApp()
  return (
    <main className="page">
      <div className="sec-head">
        <h2>Contact</h2>
      </div>

      <div className="panel" style={{ padding: 30 }}>
        <p className="contact-big">
          Working on voice agents, ML pipelines, or anything that has to hold up in production?
          <br />
          <span style={{ color: 'var(--accent)' }}>Let’s talk.</span>
        </p>
        <p style={{ color: 'var(--muted)', maxWidth: 640 }}>
          I reply fastest to concrete problems: a latency budget you can’t hit, a pipeline that
          drops events, an agent that improvises its closing line.
        </p>

        <div className="contact-methods">
          <a className="contact-card" href={`mailto:${profile.email}?subject=Hello%20from%20arnab-tries.dev`}>
            <div className="k">email</div>
            <div className="v">{profile.email}</div>
            <div className="d">work, collaborations, interesting problems</div>
          </a>
          <a className="contact-card" href={profile.linkedin} target="_blank" rel="noreferrer">
            <div className="k">linkedin</div>
            <div className="v">{profile.linkedinLabel}</div>
            <div className="d">career history</div>
          </a>
          <a className="contact-card" href={profile.github} target="_blank" rel="noreferrer">
            <div className="k">github</div>
            <div className="v">github.com/{profile.handle}</div>
            <div className="d">24 public repositories</div>
          </a>
          <button className="contact-card" style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit' }} onClick={() => setTermOpen(true)}>
            <div className="k">terminal</div>
            <div className="v">sudo hire-me</div>
            <div className="d">for the curious</div>
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2><span className="ico">#</span> Details</h2>
        <div className="sb-kv"><span>current role</span><b>{profile.role} @ {profile.company}</b></div>
        <div className="sb-kv"><span>previously</span><b>{profile.previous.title} @ {profile.previous.org} · {profile.previous.period}</b></div>
        <div className="sb-kv"><span>education</span><b>{profile.education}</b></div>
        <div className="sb-kv"><span>based in</span><b>{profile.location} · IST (UTC+5:30)</b></div>
        <div className="sb-kv"><span>response time</span><b>usually within a day</b></div>
      </div>
    </main>
  )
}
