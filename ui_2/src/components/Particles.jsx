import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE_PROFILE } from '../config/performance'
import particleVertexShader from '../shaders/particles.vert.glsl?raw'
import particleFragmentShader from '../shaders/particles.frag.glsl?raw'

function createParticleGeometry(count) {
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)

  for (let index = 0; index < count; index += 1) {
    const radius = 1.9 + Math.sqrt(Math.random()) * 7.2
    const theta = Math.random() * Math.PI * 2
    const vertical = (Math.random() - 0.5) * 7.5

    positions[index * 3] = Math.cos(theta) * radius
    positions[index * 3 + 1] = vertical
    positions[index * 3 + 2] = Math.sin(theta) * radius * 0.62 - 1.1
    seeds[index] = Math.random()
    sizes[index] = 1.2 + Math.random() * 3.4
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}

export function Particles({ audioRef, visual, theme }) {
  const particleCount = PERFORMANCE_PROFILE.particleCount
  const geometry = useMemo(() => createParticleGeometry(particleCount), [])
  const targetColors = useRef({
    primary: new THREE.Color(theme.primary),
    accent: new THREE.Color(theme.accent),
  })
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uFlux: { value: 0 },
      uEnergy: { value: visual.particleBoost },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
      uPrimary: { value: new THREE.Color(theme.primary) },
      uAccent: { value: new THREE.Color(theme.accent) },
    }),
    [],
  )
  const pointsRef = useRef()

  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    targetColors.current.primary.set(theme.primary)
    targetColors.current.accent.set(theme.accent)
  }, [theme])

  useFrame((frame, delta) => {
    const audio = audioRef.current
    const power = visual.power ?? 1
    const colorBlend = 1 - Math.exp(-1.45 * delta)
    uniforms.uTime.value = frame.clock.elapsedTime
    uniforms.uPrimary.value.lerp(targetColors.current.primary, colorBlend)
    uniforms.uAccent.value.lerp(targetColors.current.accent, colorBlend)
    uniforms.uAudio.value = THREE.MathUtils.damp(
      uniforms.uAudio.value,
      audio.volume * power,
      6,
      delta,
    )
    uniforms.uFlux.value = THREE.MathUtils.damp(
      uniforms.uFlux.value,
      audio.flux * power,
      7,
      delta,
    )
    uniforms.uEnergy.value = THREE.MathUtils.damp(
      uniforms.uEnergy.value,
      visual.particleBoost,
      3,
      delta,
    )

    if (pointsRef.current) {
      pointsRef.current.rotation.z =
        Math.sin(frame.clock.elapsedTime * 0.025) * 0.08
    }
  })

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={2}
    >
      <shaderMaterial
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
