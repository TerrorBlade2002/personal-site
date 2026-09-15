import { profile } from '../data/profile'
import { ACHIEVEMENTS, useApp } from '../store/appStore'
import Timeline from '../components/Timeline'

export default function About() {
  const unlocked = useApp((s) => s.unlocked)
  return (
    <main className="page">
      <div className="sec-head">
        <h2>About</h2>
      </div>

      <div className="panel">
        <h2><span className="ico">$</span> whoami</h2>
        {profile.about.map((par, i) => (
          <p key={i} style={{ marginBottom: 12 }}>{par}</p>
        ))}
        <div className="metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginTop: 6 }}>
          <div className="metric"><div className="v" style={{ fontSize: 16 }}>{profile.role}</div><div className="l">now · {profile.company}</div></div>
          <div className="metric"><div className="v" style={{ fontSize: 16 }}>{profile.previous.title}</div><div className="l">before · {profile.previous.org} · {profile.previous.period}</div></div>
          <div className="metric"><div className="v" style={{ fontSize: 16 }}>IIT Bombay</div><div className="l">B.Tech · 2020 – 2024</div></div>
          <div className="metric"><div className="v" style={{ fontSize: 16 }}>{profile.location}</div><div className="l">base · IST (UTC+5:30)</div></div>
        </div>
      </div>

      <section className="sec">
        <div className="sec-head">
          <h2>Trajectory</h2>
        </div>
        <Timeline items={profile.experience} />
      </section>

      <div className="about-grid">
        <div className="panel">
          <h2><span className="ico">⚙</span> Stack</h2>
          {Object.entries(profile.skills).map(([group, items]) => (
            <div className="skill-group" key={group}>
              <b>{group}</b>
              <div className="tag-row">
                {items.map((s) => <span className="tag" key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <h2><span className="ico">#</span> Achievements</h2>
          <div className="tag-row">
            {ACHIEVEMENTS.map((a) => (
              <span
                key={a.id}
                className={`tag ${unlocked.includes(a.id) ? 'on' : ''}`}
                title={unlocked.includes(a.id) ? a.desc : 'locked'}
              >
                {unlocked.includes(a.id) ? `${a.icon} ${a.name}` : '···'}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: 12 }}>
            {unlocked.length} of {ACHIEVEMENTS.length} unlocked.
          </p>
        </div>
      </div>
    </main>
  )
}
