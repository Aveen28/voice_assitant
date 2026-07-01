import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE_PROFILE } from '../config/performance'
import backgroundVertexShader from '../shaders/background.vert.glsl?raw'
import backgroundFragmentShader from '../shaders/background.frag.glsl?raw'

export function Background({ audioRef, visual, theme }) {
  const materialRef = useRef()
  const { size } = useThree()
  const targetColors = useRef({
    primary: new THREE.Color(theme.primary),
    secondary: new THREE.Color(theme.secondary),
    deep: new THREE.Color(theme.deep),
  })
  const fragmentShader = useMemo(
    () =>
      backgroundFragmentShader.replace(
        '#define FBM_OCTAVES 5',
        `#define FBM_OCTAVES ${PERFORMANCE_PROFILE.backgroundOctaves}`,
      ),
    [],
  )
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uTreble: { value: 0 },
      uEnergy: { value: visual.energy },
      uSpeed: { value: visual.speed },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uPrimary: { value: new THREE.Color(theme.primary) },
      uSecondary: { value: new THREE.Color(theme.secondary) },
      uDeep: { value: new THREE.Color(theme.deep) },
    }),
    [],
  )

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
  }, [size, uniforms])

  useEffect(() => {
    targetColors.current.primary.set(theme.primary)
    targetColors.current.secondary.set(theme.secondary)
    targetColors.current.deep.set(theme.deep)
  }, [theme])

  useFrame((frame, delta) => {
    const audio = audioRef.current
    const power = visual.power ?? 1
    const colorBlend = 1 - Math.exp(-1.25 * delta)
    uniforms.uTime.value = frame.clock.elapsedTime
    uniforms.uPrimary.value.lerp(targetColors.current.primary, colorBlend)
    uniforms.uSecondary.value.lerp(targetColors.current.secondary, colorBlend)
    uniforms.uDeep.value.lerp(targetColors.current.deep, colorBlend)
    uniforms.uAudio.value = THREE.MathUtils.damp(
      uniforms.uAudio.value,
      audio.volume * power,
      5,
      delta,
    )
    uniforms.uBass.value = THREE.MathUtils.damp(
      uniforms.uBass.value,
      audio.bass * power,
      4,
      delta,
    )
    uniforms.uTreble.value = THREE.MathUtils.damp(
      uniforms.uTreble.value,
      audio.treble * power,
      5,
      delta,
    )
    uniforms.uEnergy.value = THREE.MathUtils.damp(
      uniforms.uEnergy.value,
      visual.energy,
      3,
      delta,
    )
    uniforms.uSpeed.value = THREE.MathUtils.damp(
      uniforms.uSpeed.value,
      visual.speed,
      3,
      delta,
    )
  })

  return (
    <mesh position={[0, 0, -5]} renderOrder={-20} frustumCulled={false}>
      <planeGeometry args={[36, 20]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={backgroundVertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}
