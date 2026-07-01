import type { AudioFrame } from '../audio/audioAnalyser'
import { SETTINGS } from '../config/settings'
import type { VisualState } from '../config/states'
import { clamp, seededRandom } from '../utils/math'
import { ParticlePalette } from './gradient'

interface Particle {
  normalizedX: number
  phase: number
  drift: number
  scatter: number
  size: number
  rank: number
  paletteIndex: number
  lane: number
  edgeSeed: number
  glows: boolean
  x: number
  y: number
  radius: number
  visible: boolean
  inside: boolean
}

export class ParticleSystem {
  private readonly particles: Particle[]
  private readonly buckets: Particle[][]
  private readonly palette = new ParticlePalette()
  private animationPhase = 0
  private previousTime = 0

  constructor() {
    const random = seededRandom(84217)
    const ranks = Array.from(
      { length: SETTINGS.particles.count },
      (_, index) => index,
    )

    for (let index = ranks.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1))
      const value = ranks[index]
      ranks[index] = ranks[target]
      ranks[target] = value
    }

    this.buckets = Array.from(
      { length: SETTINGS.particles.paletteSize },
      () => [],
    )
    this.particles = Array.from(
      { length: SETTINGS.particles.count },
      (_, index) => {
        const normalizedX = clamp(
          (index / (SETTINGS.particles.count - 1)) * 2 -
            1 +
            (random() - 0.5) * 0.012,
          -1,
          1,
        )
        const lane = random() < 0.5 ? -1 : 1
        const palettePosition = clamp(
          (normalizedX + 1) * 0.5 +
            lane * 0.12 +
            (random() - 0.5) * 0.24,
          0,
          0.999,
        )
        const paletteIndex = Math.floor(
          palettePosition * SETTINGS.particles.paletteSize,
        )
        const particle: Particle = {
          normalizedX,
          phase: random() * Math.PI * 2,
          drift: 0.7 + random() * 0.7,
          scatter: (random() + random() + random() - 1.5) / 1.5,
          size: random(),
          rank: ranks[index],
          paletteIndex,
          lane,
          edgeSeed: random(),
          glows: random() < SETTINGS.particles.glowFraction,
          x: 0,
          y: 0,
          radius: 1,
          visible: false,
          inside: false,
        }

        this.buckets[paletteIndex].push(particle)
        return particle
      },
    )
  }

  draw(
    context: CanvasRenderingContext2D,
    width: number,
    centerX: number,
    centerY: number,
    orbRadius: number,
    time: number,
    visual: Readonly<VisualState>,
    audio: Readonly<AudioFrame>,
  ): void {
    if (visual.particleOpacity < 0.002 || visual.density < 0.002) {
      return
    }

    this.palette.update(
      time * 1000,
      visual.particleHue,
      visual.particleSpread,
      visual.particleSaturation,
      visual.particleLightness,
    )

    const span = clamp(
      width * SETTINGS.particles.widthRatio,
      Math.min(SETTINGS.particles.minSpan, width - 28),
      SETTINGS.particles.maxSpan,
    )
    const amplitude =
      orbRadius *
      (visual.amplitude + audio.energy * visual.audioResponse * 0.32)
    const activeParticles = visual.density * this.particles.length
    const waveform = audio.waveform
    const delta =
      this.previousTime === 0 ? 0 : clamp(time - this.previousTime, 0, 0.05)
    this.previousTime = time
    this.animationPhase += delta * visual.speed
    const speedTime = this.animationPhase

    for (const particle of this.particles) {
      const waveEdgeDensity = clamp(
        (1 - Math.abs(particle.normalizedX)) * 6,
        0,
        1,
      )
      const edgeDensity =
        waveEdgeDensity + (1 - waveEdgeDensity) * visual.orbit
      particle.visible =
        particle.rank < activeParticles && particle.edgeSeed < edgeDensity

      if (!particle.visible) {
        continue
      }

      const normalizedX = particle.normalizedX
      const waveA =
        Math.sin(normalizedX * 8.2 - speedTime * 1.72) * 0.58 +
        Math.sin(normalizedX * 18.6 + speedTime * 0.82) * 0.18
      const waveB =
        Math.sin(normalizedX * 7.1 + speedTime * 1.38 + 1.65) * 0.6 +
        Math.sin(normalizedX * 20.4 - speedTime * 0.74) * 0.16
      const laneWave = particle.lane < 0 ? waveA : waveB
      const structuredWave =
        Math.sin(normalizedX * 10.6 + speedTime * 1.9) * 0.63 +
        Math.sin(normalizedX * 21.8 - speedTime * 0.66) * 0.14
      const baseWave =
        laneWave * (1 - visual.coherence * 0.48) +
        structuredWave * visual.coherence * 0.48
      const waveformIndex = clamp(
        Math.floor(((normalizedX + 1) * 0.5) * (waveform.length - 1)),
        0,
        waveform.length - 1,
      )
      const audioWave =
        waveform[waveformIndex] * audio.energy * visual.audioResponse * 1.35
      const cloudWidth =
        0.3 +
        audio.energy * visual.audioResponse * 0.34 +
        (1 - visual.coherence) * 0.18
      const verticalScatter = particle.scatter * amplitude * cloudWidth
      const drift =
        Math.sin(speedTime * particle.drift + particle.phase) *
        (0.9 + audio.treble * 1.6)
      const waveX = centerX + normalizedX * span * 0.5 + drift
      const waveY =
        centerY + (baseWave + audioWave) * amplitude + verticalScatter
      const orbitAngle =
        (normalizedX + 1) * Math.PI +
        speedTime * 0.72 +
        particle.phase * 0.035
      const orbitRadius =
        orbRadius *
        (1.13 +
          particle.lane * 0.055 +
          particle.scatter * 0.025 +
          Math.sin(speedTime * 0.8 + particle.phase) * 0.008)
      const orbitX = centerX + Math.cos(orbitAngle) * orbitRadius
      const orbitY = centerY + Math.sin(orbitAngle) * orbitRadius

      particle.x = waveX + (orbitX - waveX) * visual.orbit
      particle.y = waveY + (orbitY - waveY) * visual.orbit
      particle.radius =
        SETTINGS.particles.minRadius +
        particle.size *
          (SETTINGS.particles.maxRadius - SETTINGS.particles.minRadius) +
        audio.treble * visual.audioResponse * 0.18
      particle.inside =
        (particle.x - centerX) * (particle.x - centerX) +
          (particle.y - centerY) * (particle.y - centerY) <
        orbRadius * orbRadius
    }

    context.save()
    this.drawGlowParticles(context, visual, audio)
    this.drawCrispParticles(context, visual, audio)
    this.drawInteriorHighlights(context, visual)
    context.restore()
  }

  private drawGlowParticles(
    context: CanvasRenderingContext2D,
    visual: Readonly<VisualState>,
    audio: Readonly<AudioFrame>,
  ): void {
    context.globalAlpha =
      visual.particleOpacity * (0.08 + audio.peak * visual.audioResponse * 0.04)

    for (let index = 0; index < this.buckets.length; index += 1) {
      context.fillStyle = this.palette.getGlow(index)
      context.beginPath()

      for (const particle of this.buckets[index]) {
        if (!particle.visible || !particle.glows) {
          continue
        }

        context.moveTo(
          particle.x + particle.radius * SETTINGS.particles.glowScale,
          particle.y,
        )
        context.arc(
          particle.x,
          particle.y,
          particle.radius * SETTINGS.particles.glowScale,
          0,
          Math.PI * 2,
        )
      }

      context.fill()
    }
  }

  private drawCrispParticles(
    context: CanvasRenderingContext2D,
    visual: Readonly<VisualState>,
    audio: Readonly<AudioFrame>,
  ): void {
    context.globalAlpha =
      visual.particleOpacity *
      (0.7 + audio.mid * visual.audioResponse * 0.14)

    for (let index = 0; index < this.buckets.length; index += 1) {
      context.fillStyle = this.palette.get(index)
      context.beginPath()

      for (const particle of this.buckets[index]) {
        if (!particle.visible) {
          continue
        }

        context.moveTo(particle.x + particle.radius, particle.y)
        context.arc(
          particle.x,
          particle.y,
          particle.radius,
          0,
          Math.PI * 2,
        )
      }

      context.fill()
    }
  }

  private drawInteriorHighlights(
    context: CanvasRenderingContext2D,
    visual: Readonly<VisualState>,
  ): void {
    context.globalAlpha = visual.particleOpacity * 0.2

    for (let index = 0; index < this.buckets.length; index += 1) {
      context.fillStyle = this.palette.getBright(index)
      context.beginPath()

      for (const particle of this.buckets[index]) {
        if (!particle.visible || !particle.inside) {
          continue
        }

        context.moveTo(particle.x + particle.radius * 0.72, particle.y)
        context.arc(
          particle.x,
          particle.y,
          particle.radius * 0.72,
          0,
          Math.PI * 2,
        )
      }

      context.fill()
    }
  }
}
