import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE_PROFILE } from '../config/performance'
import orbVertexShader from '../shaders/orb.vert.glsl?raw'
import orbFragmentShader from '../shaders/orb.frag.glsl?raw'

function dampAngle(current, target, lambda, delta) {
  const difference = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  )
  return current + difference * (1 - Math.exp(-lambda * delta))
}

function CoreSurface({ audioRef, geometry, theme, visual }) {
  const animationTimeRef = useRef(0)
  const timeScaleRef = useRef(1)
  const targetColors = useRef({
    primary: new THREE.Color(theme.primary),
    secondary: new THREE.Color(theme.secondary),
    accent: new THREE.Color(theme.accent),
  })
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uDeformation: { value: visual.deformation },
      uEnergy: { value: visual.energy },
      uLayer: { value: 1.8 },
      uOpacity: { value: 0.92 },
      uPower: { value: visual.power ?? 1 },
      uPrimary: { value: new THREE.Color(theme.primary) },
      uSecondary: { value: new THREE.Color(theme.secondary) },
      uAccent: { value: new THREE.Color(theme.accent) },
    }),
    [],
  )

  useEffect(() => {
    targetColors.current.primary.set(theme.primary)
    targetColors.current.secondary.set(theme.secondary)
    targetColors.current.accent.set(theme.accent)
  }, [theme])

  useFrame((_frame, delta) => {
    const audio = audioRef.current
    const power = visual.power ?? 1
    const colorBlend = 1 - Math.exp(-1.35 * delta)
    const timeResponse = power > timeScaleRef.current ? 1.15 : 1.5

    timeScaleRef.current = THREE.MathUtils.damp(
      timeScaleRef.current,
      power,
      timeResponse,
      delta,
    )
    if (power === 0 && timeScaleRef.current < 0.005) {
      timeScaleRef.current = 0
    }

    animationTimeRef.current += delta * timeScaleRef.current
    uniforms.uTime.value = animationTimeRef.current
    uniforms.uPrimary.value.lerp(targetColors.current.primary, colorBlend)
    uniforms.uSecondary.value.lerp(targetColors.current.secondary, colorBlend)
    uniforms.uAccent.value.lerp(targetColors.current.accent, colorBlend)
    uniforms.uAudio.value = THREE.MathUtils.damp(
      uniforms.uAudio.value,
      audio.volume * power,
      7,
      delta,
    )
    uniforms.uBass.value = THREE.MathUtils.damp(
      uniforms.uBass.value,
      audio.bass * power,
      6,
      delta,
    )
    uniforms.uMid.value = THREE.MathUtils.damp(
      uniforms.uMid.value,
      audio.mid * power,
      6,
      delta,
    )
    uniforms.uTreble.value = THREE.MathUtils.damp(
      uniforms.uTreble.value,
      audio.treble * power,
      7,
      delta,
    )

    const frequencyEnergy = Math.min(
      1,
      audio.volume * 0.55 +
        audio.bass * 0.12 +
        audio.mid * 0.25 +
        audio.treble * 0.08,
    )
    const targetDeformation =
      visual.deformation +
      frequencyEnergy * (visual.audioDeformation ?? 0)
    const deformationResponse =
      visual.audioDeformation && targetDeformation > uniforms.uDeformation.value
        ? 11
        : visual.audioDeformation
          ? 8
          : 3.5

    uniforms.uDeformation.value = THREE.MathUtils.damp(
      uniforms.uDeformation.value,
      targetDeformation,
      deformationResponse,
      delta,
    )
    uniforms.uEnergy.value = THREE.MathUtils.damp(
      uniforms.uEnergy.value,
      visual.energy,
      3.5,
      delta,
    )
    uniforms.uPower.value = THREE.MathUtils.damp(
      uniforms.uPower.value,
      power,
      power > uniforms.uPower.value ? 1.15 : 1.5,
      delta,
    )
  })

  return (
    <mesh geometry={geometry} renderOrder={5}>
      <shaderMaterial
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export function Orb({ audioRef, visual, theme, state }) {
  const groupRef = useRef()
  const rotationSpeedRef = useRef(0.05)
  const coreGeometry = useMemo(
    () =>
      new THREE.IcosahedronGeometry(
        1.1,
        PERFORMANCE_PROFILE.coreDetail,
      ),
    [],
  )

  useEffect(() => () => coreGeometry.dispose(), [coreGeometry])

  useFrame((frame, delta) => {
    if (!groupRef.current) return

    const audio = audioRef.current
    const power = visual.power ?? 1
    const speakingPulse =
      state === 'speaking'
        ? Math.sin(frame.clock.elapsedTime * 5.5) * 0.025
        : 0
    const voiceEnergy = Math.min(
      1,
      audio.volume * 0.52 +
        audio.bass * 0.18 +
        audio.mid * 0.24 +
        audio.treble * 0.04 +
        audio.flux * 0.02,
    )
    const audioScale =
      power === 0
        ? 0
        : state === 'voice-detected'
          ? (voiceEnergy - 0.16) * 0.34
          : audio.volume * 0.075 + audio.bass * 0.045
    const targetScale = visual.scale + audioScale + speakingPulse
    const scaleResponse =
      power === 0
        ? 1.35
        : state === 'voice-detected'
          ? targetScale > groupRef.current.scale.x
            ? 12
            : 8
          : 5.5
    const scale = THREE.MathUtils.damp(
      groupRef.current.scale.x,
      targetScale,
      scaleResponse,
      delta,
    )
    const targetRotationSpeed =
      power * (0.025 + visual.speed * 0.12 + audio.treble * 0.08)
    const rotationResponse =
      targetRotationSpeed > rotationSpeedRef.current ? 1.3 : 0.8

    rotationSpeedRef.current = THREE.MathUtils.damp(
      rotationSpeedRef.current,
      targetRotationSpeed,
      rotationResponse,
      delta,
    )

    groupRef.current.scale.setScalar(scale)
    if (power === 0) {
      groupRef.current.rotation.x = dampAngle(
        groupRef.current.rotation.x,
        0.07,
        1.25,
        delta,
      )
      groupRef.current.rotation.y = dampAngle(
        groupRef.current.rotation.y,
        0.28,
        1.25,
        delta,
      )
      groupRef.current.rotation.z = dampAngle(
        groupRef.current.rotation.z,
        -0.035,
        1.25,
        delta,
      )
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        0.1,
        1.25,
        delta,
      )
    } else {
      groupRef.current.rotation.y += delta * rotationSpeedRef.current
      groupRef.current.rotation.x = dampAngle(
        groupRef.current.rotation.x,
        Math.sin(frame.clock.elapsedTime * 0.19) * 0.08,
        1.8,
        delta,
      )
      groupRef.current.rotation.z = dampAngle(
        groupRef.current.rotation.z,
        0,
        1.8,
        delta,
      )
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        0.14 + Math.sin(frame.clock.elapsedTime * 0.42) * 0.045,
        1.8,
        delta,
      )
    }
  })

  return (
    <group ref={groupRef}>
      <CoreSurface
        audioRef={audioRef}
        geometry={coreGeometry}
        theme={theme}
        visual={visual}
      />
    </group>
  )
}
