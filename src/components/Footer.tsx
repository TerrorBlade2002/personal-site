import { Link } from 'react-router-dom'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { useApp } from '../store/appStore'

export default function Footer() {
  const { setTermOpen } = useApp()
  return (
    <footer className="ftr">
      <div className="ftr-inner">
        <div>
          <div className="sig">
            <span className="name">{profile.fullName} — {profile.role}, {profile.company}</span>
            previously {profile.previous.title}, {profile.previous.org} · {profile.education}
            <br />
            {profile.tagline}
          </div>
        </div>
        <div>
          <h4>Navigate</h4>
          <ul>
            <li><Link to="/projects">Projects ({projects.length})</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><button className="term-link" onClick={() => setTermOpen(true)}>Terminal</button></li>
          </ul>
        </div>
        <div>
          <h4>Reach out</h4>
          <ul>
            <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
            <li><a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedinLabel}</a></li>
            <li><a href={profile.github} target="_blank" rel="noreferrer">github.com/{profile.handle}</a></li>
          </ul>
        </div>
      </div>
      <div className="ftr-bottom">
        <span>© {new Date().getFullYear()} {profile.fullName} · {profile.location}</span>
        <span>React · Three.js · Cloudflare</span>
      </div>
    </footer>
  )
}
