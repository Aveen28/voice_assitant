import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import shootingStarVertexShader from '../shaders/shootingStar.vert.glsl?raw'
import shootingStarFragmentShader from '../shaders/shootingStar.frag.glsl?raw'

const STAR_DEPTH = -3.2

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum)
}

export function ShootingStars() {
  const meshRef = useRef()
  const materialRef = useRef()
  const motionRef = useRef(null)
  const nextSpawnRef = useRef(0.8)
  const { camera, size } = useThree()
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#dcefff') },
      uOpacity: { value: 0 },
      uAspect: { value: 16 },
    }),
    [],
  )

  useFrame((frame) => {
    const mesh = meshRef.current
    const material = materialRef.current
    if (!mesh || !material) return

    const now = frame.clock.elapsedTime
    let motion = motionRef.current

    if (!motion && now >= nextSpawnRef.current) {
      const cameraDistance = Math.abs(camera.position.z - STAR_DEPTH)
      const visibleHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        cameraDistance
      const visibleWidth = visibleHeight * (size.width / size.height)
      const direction = Math.random() > 0.5 ? 1 : -1
      const margin = visibleWidth * 0.08
      const startX = direction > 0
        ? -visibleWidth * 0.5 - margin
        : visibleWidth * 0.5 + margin
      const endX = -startX
      const startY = randomBetween(-visibleHeight * 0.34, visibleHeight * 0.34)
      const endY = THREE.MathUtils.clamp(
        startY + randomBetween(-visibleHeight * 0.22, visibleHeight * 0.22),
        -visibleHeight * 0.4,
        visibleHeight * 0.4,
      )
      const start = new THREE.Vector2(startX, startY)
      const end = new THREE.Vector2(endX, endY)
      const heading = end.clone().sub(start).normalize()
      const trailLength = randomBetween(
        visibleWidth * 0.15,
        visibleWidth * 0.22,
      )
      const trailHeight = visibleHeight * randomBetween(0.018, 0.024)

      motion = {
        duration: randomBetween(1.55, 2.05),
        end,
        head: new THREE.Vector2(),
        heading,
        opacity: randomBetween(0.72, 0.88),
        start,
        startedAt: now,
        trailLength,
      }
      motionRef.current = motion

      mesh.visible = true
      mesh.rotation.z = Math.atan2(heading.y, heading.x)
      mesh.scale.set(trailLength, trailHeight, 1)
      material.uniforms.uAspect.value = trailLength / trailHeight
    }

    if (!motion) {
      mesh.visible = false
      return
    }

    const progress = (now - motion.startedAt) / motion.duration
    if (progress >= 1) {
      mesh.visible = false
      material.uniforms.uOpacity.value = 0
      motionRef.current = null
      nextSpawnRef.current = now + randomBetween(2.8, 6.2)
      return
    }

    const head = motion.head.copy(motion.start).lerp(motion.end, progress)
    mesh.position.set(
      head.x - motion.heading.x * motion.trailLength * 0.42,
      head.y - motion.heading.y * motion.trailLength * 0.42,
      STAR_DEPTH,
    )

    const fadeIn = Math.min(1, progress / 0.08)
    const fadeOut = Math.min(1, (1 - progress) / 0.16)
    material.uniforms.uOpacity.value =
      motion.opacity * fadeIn * fadeOut
  })

  return (
    <mesh
      ref={meshRef}
      visible={false}
      renderOrder={-15}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={shootingStarVertexShader}
        fragmentShader={shootingStarFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
