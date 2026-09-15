import { useState } from 'react'
import SandboxShell, { useSandboxTouch } from '../components/SandboxShell'

// Pocket storefront: catalog → cart → coupon → checkout, like the Django original.
type Item = { id: string; name: string; emoji: string; price: number; was: number }

const CATALOG: Item[] = [
  { id: 'kb', name: 'Mech Keyboard', emoji: '⌨️', price: 89, was: 129 },
  { id: 'hp', name: 'Studio Headphones', emoji: '🎧', price: 59, was: 79 },
  { id: 'mn', name: '27" Monitor', emoji: '🖥️', price: 219, was: 299 },
  { id: 'ch', name: 'Ergo Chair', emoji: '🪑', price: 179, was: 249 },
  { id: 'lm', name: 'Desk Lamp', emoji: '💡', price: 24, was: 39 },
  { id: 'mg', name: 'Debug Mug', emoji: '☕', price: 12, was: 18 },
]

export default function EcommSandbox() {
  const touch = useSandboxTouch('ecomm')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState(false)
  const [order, setOrder] = useState<string | null>(null)

  const add = (id: string) => { touch(); setOrder(null); setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })) }
  const remove = (id: string) => setCart((c) => {
    const n = { ...c }
    if (n[id] > 1) n[id]--
    else delete n[id]
    return n
  })

  const entries = Object.entries(cart)
  const subtotal = entries.reduce((s, [id, n]) => s + CATALOG.find((i) => i.id === id)!.price * n, 0)
  const discount = applied ? subtotal * 0.2 : 0
  const total = subtotal - discount

  const applyCoupon = () => {
    touch()
    setApplied(coupon.trim().toUpperCase() === 'SOC22')
  }

  const checkout = () => {
    touch()
    setOrder(`ORD-${Math.floor(1000 + Math.random() * 9000)} confirmed · $${total.toFixed(2)} · ${entries.reduce((s, [, n]) => s + n, 0)} items`)
    setCart({})
    setApplied(false)
    setCoupon('')
  }

  return (
    <SandboxShell
      id="ecomm"
      title="e-comm-22 — pocket storefront"
      note="the 2022 original is server-rendered Django with SQLite, sessions and the mighty admin panel. This is the same product→cart→discount→order loop, client-side. The coupon is hidden in plain sight."
    >
      <div className="sb-grid2">
        <div>
          <span className="sb-label">catalog</span>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginTop: 8 }}>
            {CATALOG.map((i) => (
              <div key={i.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, background: 'var(--panel)', textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{i.emoji}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{i.name}</div>
                <div style={{ fontSize: 12 }}><s className="t-sys" style={{ color: 'var(--dim)' }}>${i.was}</s> <b style={{ color: 'var(--green)' }}>${i.price}</b></div>
                <button className="btn small ghost" style={{ marginTop: 8 }} onClick={() => add(i.id)}>+ add</button>
              </div>
            ))}
          </div>
        </div>
        <div className="sb-col">
          <span className="sb-label">cart 🛒</span>
          {entries.length === 0 && !order && <span className="t-sys" style={{ fontSize: 12.5 }}>Cart is empty.</span>}
          {entries.map(([id, n]) => {
            const item = CATALOG.find((i) => i.id === id)!
            return (
              <div className="sb-kv" key={id}>
                <span>{item.emoji} {item.name} ×{n}</span>
                <b>
                  ${(item.price * n).toFixed(2)}{' '}
                  <button className="term-link" onClick={() => remove(id)}>−</button>
                </b>
              </div>
            )
          })}
          {entries.length > 0 && (
            <>
              <div className="sb-row">
                <input className="sb-input" placeholder="coupon code?" value={coupon} onChange={(e) => setCoupon(e.target.value)} style={{ flex: 1 }} />
                <button className="btn small ghost" onClick={applyCoupon}>apply</button>
              </div>
              {applied && <span className="t-ok" style={{ fontSize: 12.5 }}>SOC22 applied — 20% off</span>}
              {!applied && coupon && <span className="t-err" style={{ fontSize: 12.5 }}>Invalid code. Hint: the program name and the year.</span>}
              <div className="sb-kv"><span>subtotal</span><b>${subtotal.toFixed(2)}</b></div>
              {applied && <div className="sb-kv"><span>discount</span><b style={{ color: 'var(--green)' }}>−${discount.toFixed(2)}</b></div>}
              <div className="sb-kv"><span>total</span><b style={{ color: 'var(--accent)', fontSize: 15 }}>${total.toFixed(2)}</b></div>
              <button className="btn small" onClick={checkout}>checkout →</button>
            </>
          )}
          {order && <span className="t-ok" style={{ fontSize: 12.5 }}>✓ {order}</span>}
        </div>
      </div>
    </SandboxShell>
  )
}
