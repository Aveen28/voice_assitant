import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import orbVertexShader from '../shaders/orb.vert.glsl?raw'
import orbFragmentShader from '../shaders/orb.frag.glsl?raw'

function dampAngle(current, target, lambda, delta) {
  const difference = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  )
  return current + difference * (1 - Math.exp(-lambda * delta))
}

function EnergyShell({
  audioRef,
  geometry,
  layer,
  opacity,
  scale,
  theme,
  visual,
  side = THREE.FrontSide,
  blending = THREE.NormalBlending,
}) {
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
      uLayer: { value: layer },
      uOpacity: { value: opacity },
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

  useFrame((frame, delta) => {
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
    <mesh scale={scale} geometry={geometry} renderOrder={4 + layer}>
      <shaderMaterial
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={side}
        blending={blending}
      />
    </mesh>
  )
}

function EnergyFilaments({ audioRef, visual, theme }) {
  const groupRef = useRef()
  const materialsRef = useRef([])
  const motionSpeedRef = useRef(0.12)
  const motionPhaseRef = useRef(0)
  const targetColors = useRef({
    primary: new THREE.Color(theme.primary),
    accent: new THREE.Color(theme.accent),
  })

  useEffect(() => {
    targetColors.current.primary.set(theme.primary)
    targetColors.current.accent.set(theme.accent)
  }, [theme])

  useFrame((_frame, delta) => {
    if (!groupRef.current) return

    const audio = audioRef.current
    const power = visual.power ?? 1
    const targetSpeed = power *
      (0.06 + visual.speed * 0.42 + audio.mid * 0.28)
    const response =
      targetSpeed > motionSpeedRef.current ? 2.8 : 0.9
    motionSpeedRef.current = THREE.MathUtils.damp(
      motionSpeedRef.current,
      targetSpeed,
      response,
      delta,
    )
    motionPhaseRef.current += delta * motionSpeedRef.current * 1.4
    const colorBlend = 1 - Math.exp(-1.4 * delta)

    if (power === 0) {
      groupRef.current.rotation.x = dampAngle(
        groupRef.current.rotation.x,
        0.22,
        1.35,
        delta,
      )
      groupRef.current.rotation.y = dampAngle(
        groupRef.current.rotation.y,
        -0.3,
        1.35,
        delta,
      )
      groupRef.current.rotation.z = dampAngle(
        groupRef.current.rotation.z,
        0.08,
        1.35,
        delta,
      )
    } else {
      groupRef.current.rotation.x += delta * motionSpeedRef.current * 0.62
      groupRef.current.rotation.y -= delta * motionSpeedRef.current
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z,
        Math.sin(motionPhaseRef.current) * 0.34,
        2.2,
        delta,
      )
    }

    materialsRef.current.forEach((material, index) => {
      if (!material) return
      material.color.lerp(
        index === 1
          ? targetColors.current.accent
          : targetColors.current.primary,
        colorBlend,
      )
      material.opacity = THREE.MathUtils.damp(
        material.opacity,
        0.025 +
          power *
            (0.195 +
              visual.energy * 0.28 +
              audio.volume * (0.4 + index * 0.08)),
        power === 0 ? 1.4 : 6,
        delta,
      )
    })
  })

  return (
    <group ref={groupRef} scale={0.98}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          rotation={[
            index * 1.17 + 0.3,
            index * 0.83,
            index * 1.61 + 0.4,
          ]}
        >
          <torusKnotGeometry
            args={[0.76 + index * 0.075, 0.008 + index * 0.003, 144, 8, 2, 3]}
          />
          <meshBasicMaterial
            ref={(material) => {
              materialsRef.current[index] = material
            }}
            color={
              index === 1
                ? targetColors.current.accent
                : targetColors.current.primary
            }
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

function ReactiveRings({ audioRef, visual, theme }) {
  const ringsRef = useRef([])
  const motionSpeedRef = useRef(0.14)
  const motionPhaseRef = useRef(0)
  const targetColors = useRef({
    primary: new THREE.Color(theme.primary),
    accent: new THREE.Color(theme.accent),
  })

  useEffect(() => {
    targetColors.current.primary.set(theme.primary)
    targetColors.current.accent.set(theme.accent)
  }, [theme])

  useFrame((_frame, delta) => {
    const audio = audioRef.current
    const power = visual.power ?? 1
    const targetSpeed =
      power * (0.1 + visual.speed * 0.55 + audio.mid * 0.12)
    const response =
      targetSpeed > motionSpeedRef.current ? 2.7 : 0.85
    motionSpeedRef.current = THREE.MathUtils.damp(
      motionSpeedRef.current,
      targetSpeed,
      response,
      delta,
    )
    motionPhaseRef.current += delta * (0.35 + motionSpeedRef.current)
    const colorBlend = 1 - Math.exp(-1.35 * delta)

    ringsRef.current.forEach((ring, index) => {
      if (!ring) return
      ring.material.color.lerp(
        index === 2
          ? targetColors.current.accent
          : targetColors.current.primary,
        colorBlend,
      )

      const phase = motionPhaseRef.current - index * 0.72
      const pulse = (Math.sin(phase) * 0.5 + 0.5) *
        power *
        (0.025 + audio.volume * 0.12 + visual.energy * 0.018)
      const targetScale = 1 + index * 0.16 + pulse
      const scale = THREE.MathUtils.damp(
        ring.scale.x,
        targetScale,
        5,
        delta,
      )
      ring.scale.setScalar(scale)
      ring.rotation.z = power === 0
        ? dampAngle(
            ring.rotation.z,
            [0.18, -0.42, 0.72][index],
            1.25,
            delta,
          )
        : ring.rotation.z +
          delta * (index % 2 ? -1 : 1) * motionSpeedRef.current
      ring.material.opacity = THREE.MathUtils.damp(
        ring.material.opacity,
        0.018 +
          power * (0.062 + visual.energy * 0.11 + audio.flux * 0.35),
        power === 0 ? 1.35 : 6,
        delta,
      )
    })
  })

  return (
    <group position={[0, 0, -0.08]}>
      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          ref={(ring) => {
            ringsRef.current[index] = ring
          }}
          rotation={[0, 0, index * 0.78]}
        >
          <ringGeometry args={[1.61, 1.62 + index * 0.006, 192]} />
          <meshBasicMaterial
            color={
              index === 2
                ? targetColors.current.accent
                : targetColors.current.primary
            }
            transparent
            opacity={0.14}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

export function Orb({ audioRef, visual, theme, state }) {
  const groupRef = useRef()
  const rotationSpeedRef = useRef(0.05)
  const shellGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(1.28, 5),
    [],
  )
  const coreGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(0.74, 4),
    [],
  )

  useEffect(
    () => () => {
      shellGeometry.dispose()
      coreGeometry.dispose()
    },
    [shellGeometry, coreGeometry],
  )

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
    const targetScale =
      visual.scale +
      audioScale +
      speakingPulse
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
      <EnergyFilaments
        audioRef={audioRef}
        visual={visual}
        theme={theme}
      />
      <EnergyShell
        audioRef={audioRef}
        geometry={coreGeometry}
        layer={1.8}
        opacity={0.92}
        scale={1}
        theme={theme}
        visual={visual}
        blending={THREE.AdditiveBlending}
      />
      <EnergyShell
        audioRef={audioRef}
        geometry={shellGeometry}
        layer={0}
        opacity={0.78}
        scale={1}
        theme={theme}
        visual={visual}
      />
      <EnergyShell
        audioRef={audioRef}
        geometry={shellGeometry}
        layer={0.9}
        opacity={0.42}
        scale={1.055}
        theme={theme}
        visual={visual}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
      <EnergyShell
        audioRef={audioRef}
        geometry={shellGeometry}
        layer={1.35}
        opacity={0.24}
        scale={1.12}
        theme={theme}
        visual={visual}
        blending={THREE.AdditiveBlending}
      />
      <ReactiveRings
        audioRef={audioRef}
        visual={visual}
        theme={theme}
      />
    </group>
  )
}
