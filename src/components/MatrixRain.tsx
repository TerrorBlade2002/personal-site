import { useEffect, useRef } from 'react'
import { useApp } from '../store/appStore'

// Classic digital-rain easter egg, triggered by the `matrix` command.
export default function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { setMatrix, unlock } = useApp()

  useEffect(() => {
    unlock('red-pill')
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const chars = 'アカサタナハマヤラワ0123456789ABCDEF<>/{}$#@'
    const cols = Math.floor(canvas.width / 16)
    const drops = new Array(cols).fill(1)
    const iv = setInterval(() => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#4ade80'
      ctx.font = '15px monospace'
      drops.forEach((y, i) => {
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 16, y * 16)
        drops[i] = y * 16 > canvas.height && Math.random() > 0.975 ? 0 : y + 1
      })
    }, 40)
    const stop = setTimeout(() => setMatrix(false), 7000)
    const onClick = () => setMatrix(false)
    canvas.addEventListener('click', onClick)
    return () => { clearInterval(iv); clearTimeout(stop); canvas.removeEventListener('click', onClick) }
  }, [setMatrix, unlock])

  return <canvas ref={ref} className="matrix-overlay" title="click to exit" />
}
