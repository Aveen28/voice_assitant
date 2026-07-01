import { SETTINGS } from '../config/settings'
import type { RgbColor, VisualState } from '../config/states'
import type { AudioFrame } from '../audio/audioAnalyser'

const rgba = (color: RgbColor, alpha: number): string =>
  `rgba(${Math.round(color[0])}, ${Math.round(color[1])}, ${Math.round(color[2])}, ${alpha})`

const colorKey = (color: RgbColor, accent: RgbColor): string =>
  `${color.map(Math.round).join(',')}:${accent.map(Math.round).join(',')}`

export class OrbRenderer {
  private readonly texture = document.createElement('canvas')
  private cachedColorKey = ''

  constructor() {
    const size = SETTINGS.orb.textureSize
    this.texture.width = size
    this.texture.height = size
  }

  draw(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    time: number,
    visual: Readonly<VisualState>,
    audio: Readonly<AudioFrame>,
  ): void {
    this.updateTextures(visual.orbColor, visual.orbAccent)

    const breathing = Math.sin(time * SETTINGS.orb.breathingSpeed) *
      SETTINGS.orb.breathingAmount
    const audioPulse = audio.energy *
      visual.audioResponse *
      SETTINGS.orb.audioPulseAmount
    const scale = 1 + breathing + audioPulse
    const size = radius * 2.5 * scale
    const x = centerX - size / 2
    const y = centerY - size / 2

    context.save()
    context.globalAlpha =
      visual.orbOpacity * (0.82 + visual.glow * 0.18 + audio.peak * 0.04)
    context.drawImage(this.texture, x, y, size, size)
    context.restore()
  }

  private updateTextures(color: RgbColor, accent: RgbColor): void {
    const key = colorKey(color, accent)

    if (key === this.cachedColorKey) {
      return
    }

    this.renderTexture(color, accent)
    this.cachedColorKey = key
  }

  private renderTexture(color: RgbColor, accent: RgbColor): void {
    const context = this.texture.getContext('2d')

    if (!context) {
      return
    }

    const size = this.texture.width
    const center = size / 2
    const sphereRadius = size * 0.4
    const glass = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      sphereRadius,
    )

    context.clearRect(0, 0, size, size)
    glass.addColorStop(0, rgba(color, 0.006))
    glass.addColorStop(0.68, rgba(color, 0.012))
    glass.addColorStop(0.88, rgba(color, 0.035))
    glass.addColorStop(0.965, rgba(accent, 0.11))
    glass.addColorStop(1, rgba(accent, 0.025))
    context.fillStyle = glass
    context.beginPath()
    context.arc(center, center, sphereRadius, 0, Math.PI * 2)
    context.fill()

    context.save()
    context.strokeStyle = rgba(color, 0.2)
    context.lineWidth = 10
    context.shadowColor = rgba(color, 0.66)
    context.shadowBlur = 20
    context.beginPath()
    context.arc(center, center, sphereRadius, 0, Math.PI * 2)
    context.stroke()
    context.restore()

    context.strokeStyle = rgba(accent, 0.86)
    context.lineWidth = 3.2
    context.beginPath()
    context.arc(center, center, sphereRadius - 1.3, 0, Math.PI * 2)
    context.stroke()

    context.strokeStyle = rgba(accent, 0.2)
    context.lineWidth = 1.4
    context.beginPath()
    context.arc(center, center, sphereRadius - 5, 0, Math.PI * 2)
    context.stroke()
  }
}
