import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="page">
      <div className="empty-state">
        <div className="big">4🛰️4</div>
        <div>segment fault: this sector of space is uncharted.</div>
        <p style={{ marginTop: 16 }}>
          <Link className="btn" to="/">return to mission control</Link>
        </p>
      </div>
    </main>
  )
}
