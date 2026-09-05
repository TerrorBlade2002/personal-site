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
            <span className="name">{profile.fullName} — {profile.role} @ {profile.company}</span>
            previously {profile.previous.title} @ {profile.previous.org} · {profile.education}
            <br />
            {profile.tagline}
          </div>
        </div>
        <div>
          <h4>Navigate</h4>
          <ul>
            <li><Link to="/projects">All projects ({projects.length})</Link></li>
            <li><Link to="/about">About + skills</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><button className="term-link" onClick={() => setTermOpen(true)}>Open terminal (`)</button></li>
          </ul>
        </div>
        <div>
          <h4>Reach out</h4>
          <ul>
            <li><a href={`mailto:${profile.email}`}>{profile.email}</a></li>
            <li><a href={profile.linkedin} target="_blank" rel="noreferrer">{profile.linkedinLabel}</a></li>
            <li><a href={profile.github} target="_blank" rel="noreferrer">github.com/{profile.handle}</a></li>
            <li><a href={`${profile.github}?tab=repositories`} target="_blank" rel="noreferrer">All 24 repositories</a></li>
          </ul>
        </div>
      </div>
      <div className="ftr-bottom">
        <span><span className="status-ok">●</span> all systems nominal · static build · zero runtime APIs</span>
        <span>© {new Date().getFullYear()} {profile.name} · built with React, Three.js & an unhealthy love of terminals</span>
      </div>
    </footer>
  )
}
