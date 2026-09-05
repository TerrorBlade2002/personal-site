import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type TrailHandle = { push: (x: number, y: number, z: number) => void; clear: () => void }

// Fixed-length ring-buffer polyline. Newest point is always at the end of the
// buffer, so a precomputed colour gradient (fade → color) doubles as the tail
// fade without needing per-vertex alpha.
const Trail = forwardRef<TrailHandle, { length: number; color: string; fade: string }>(
  function Trail({ length, color, fade }, ref) {
    const positions = useMemo(() => new Float32Array(length * 3), [length])
    const colors = useMemo(() => new Float32Array(length * 3), [length])
    const count = useRef(0)

    const line = useMemo(() => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      g.setDrawRange(0, 0)
      const m = new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false })
      const l = new THREE.Line(g, m)
      l.frustumCulled = false
      return l
    }, [positions, colors])

    useEffect(() => {
      const c1 = new THREE.Color(fade)
      const c2 = new THREE.Color(color)
      const tmp = new THREE.Color()
      for (let i = 0; i < length; i++) {
        const t = i / (length - 1)
        tmp.copy(c1).lerp(c2, t * t)
        colors[i * 3] = tmp.r
        colors[i * 3 + 1] = tmp.g
        colors[i * 3 + 2] = tmp.b
      }
      ;(line.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true
    }, [color, fade, length, colors, line])

    useImperativeHandle(ref, () => ({
      push(x, y, z) {
        positions.copyWithin(0, 3)
        const i = (length - 1) * 3
        positions[i] = x
        positions[i + 1] = y
        positions[i + 2] = z
        count.current = Math.min(length, count.current + 1)
        ;(line.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true
        line.geometry.setDrawRange(length - count.current, count.current)
      },
      clear() {
        count.current = 0
        line.geometry.setDrawRange(0, 0)
      },
    }), [positions, length, line])

    useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose() }, [line])

    return <primitive object={line} />
  },
)

export default Trail
