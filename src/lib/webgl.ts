// WebGL availability probe. Locked-down corporate machines, VDI sessions and
// browsers with hardware acceleration disabled can fail to hand back a context
// — in that case the hero renders a static fallback instead of a dead canvas.
export function hasWebGL(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return false
    if (typeof gl.isContextLost === 'function' && gl.isContextLost()) return false
    // Release the probe context immediately; browsers cap how many can exist.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}
