import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty-state">
        <div className="big">404</div>
        <div>No such path.</div>
        <p style={{ marginTop: 16 }}>
          <Link className="btn" to="/">Back home</Link>
        </p>
      </div>
    </main>
  )
}
