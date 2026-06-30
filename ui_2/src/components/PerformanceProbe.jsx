import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function PerformanceProbe({ onUpdate }) {
  const sampleRef = useRef({
    frames: 0,
    startedAt: performance.now(),
  })

  useFrame(() => {
    const now = performance.now()
    sampleRef.current.frames += 1
    const elapsed = now - sampleRef.current.startedAt

    if (elapsed >= 1000) {
      onUpdate(Math.round((sampleRef.current.frames * 1000) / elapsed))
      sampleRef.current.frames = 0
      sampleRef.current.startedAt = now
    }
  })

  return null
}
