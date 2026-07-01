import type { AudioFrame } from '../audio/audioAnalyser'
import { SETTINGS } from '../config/settings'
import type { VisualState } from '../config/states'
import { clamp } from '../utils/math'
import { OrbRenderer } from './orbRenderer'
import { ParticleSystem } from './particleSystem'

export class Renderer {
  private readonly context: CanvasRenderingContext2D
  private readonly orb = new OrbRenderer()
  private readonly particles = new ParticleSystem()
  private width = 1
  private height = 1
  private backgroundGradient: CanvasGradient | string = SETTINGS.renderer.background

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    })

    if (!context) {
      throw new Error('Canvas 2D is not supported')
    }

    this.context = context
    this.resize()
  }

  resize(): void {
    this.width = Math.max(1, window.innerWidth)
    this.height = Math.max(1, window.innerHeight)

    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      SETTINGS.renderer.maxPixelRatio,
    )

    this.canvas.width = Math.floor(this.width * pixelRatio)
    this.canvas.height = Math.floor(this.height * pixelRatio)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

    const centerX = this.width / 2
    const centerY = this.height * 0.47
    const radius = Math.max(this.width, this.height) * 0.58
    const gradient = this.context.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius,
    )
    gradient.addColorStop(0, SETTINGS.renderer.backgroundHalo)
    gradient.addColorStop(0.42, SETTINGS.renderer.background)
    gradient.addColorStop(1, SETTINGS.renderer.background)
    this.backgroundGradient = gradient
  }

  render(
    time: number,
    visual: Readonly<VisualState>,
    audio: Readonly<AudioFrame>,
  ): void {
    const context = this.context
    const centerX = this.width / 2
    const centerY = this.height * 0.47
    const radius = clamp(
      Math.min(this.width, this.height) * SETTINGS.orb.viewportScale,
      SETTINGS.orb.minRadius,
      SETTINGS.orb.maxRadius,
    )

    context.globalAlpha = 1
    context.fillStyle = this.backgroundGradient
    context.fillRect(0, 0, this.width, this.height)
    this.orb.draw(context, centerX, centerY, radius, time, visual, audio)
    this.particles.draw(
      context,
      this.width,
      centerX,
      centerY,
      radius,
      time,
      visual,
      audio,
    )
  }
}
