import { useApp } from '../store/appStore'

export default function Toasts() {
  const { toasts } = useApp()
  if (!toasts.length) return null
  return (
    <div className="toasts" role="status">
      {toasts.map((t) => (
        <div className="toast" key={t.id}>
          <b>{t.title}</b>
          {t.body}
        </div>
      ))}
    </div>
  )
}
