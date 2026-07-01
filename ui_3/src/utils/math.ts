export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const seededRandom = (seed: number): (() => number) => {
  let value = seed >>> 0

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export const wrapHue = (hue: number): number => ((hue % 360) + 360) % 360
