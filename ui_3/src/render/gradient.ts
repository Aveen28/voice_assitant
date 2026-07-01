import { SETTINGS } from '../config/settings'
import { wrapHue } from '../utils/math'

export class ParticlePalette {
  private readonly colors: string[]
  private readonly brightColors: string[]
  private readonly glowColors: string[]
  private lastUpdate = -Infinity
  private lastHue = -1
  private lastSpread = -1
  private lastSaturation = -1
  private lastLightness = -1
  private lastCycle = -1

  constructor() {
    this.colors = Array.from(
      { length: SETTINGS.particles.paletteSize },
      () => '#ffffff',
    )
    this.brightColors = [...this.colors]
    this.glowColors = [...this.colors]
  }

  update(
    timeMs: number,
    hue: number,
    spread: number,
    saturation: number,
    lightness: number,
  ): void {
    const cycle = Math.sin(timeMs * 0.00016) * 15
    const needsRefresh =
      timeMs - this.lastUpdate >= SETTINGS.particles.paletteRefreshMs &&
      (Math.abs(hue - this.lastHue) > 0.35 ||
        Math.abs(spread - this.lastSpread) > 0.35 ||
        Math.abs(saturation - this.lastSaturation) > 0.35 ||
        Math.abs(lightness - this.lastLightness) > 0.35 ||
        Math.abs(cycle - this.lastCycle) > 0.45)

    if (!needsRefresh) {
      return
    }

    this.colors.forEach((_, index) => {
      const position = index / Math.max(1, this.colors.length - 1) - 0.5
      const colorHue = wrapHue(hue + spread * position + cycle)
      this.colors[index] =
        `hsl(${colorHue} ${saturation}% ${lightness}%)`
      this.brightColors[index] =
        `hsl(${colorHue} ${saturation}% ${Math.min(90, lightness + 18)}%)`
      this.glowColors[index] =
        `hsl(${colorHue} ${saturation}% ${Math.min(82, lightness + 8)}%)`
    })

    this.lastUpdate = timeMs
    this.lastHue = hue
    this.lastSpread = spread
    this.lastSaturation = saturation
    this.lastLightness = lightness
    this.lastCycle = cycle
  }

  get(index: number): string {
    return this.colors[index % this.colors.length]
  }

  getBright(index: number): string {
    return this.brightColors[index % this.brightColors.length]
  }

  getGlow(index: number): string {
    return this.glowColors[index % this.glowColors.length]
  }
}
