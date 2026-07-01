import type { RgbColor } from '../config/states'

export const lerp = (from: number, to: number, amount: number): number =>
  from + (to - from) * amount

export const dampFactor = (response: number, delta: number): number =>
  1 - Math.exp(-response * delta)

export const lerpColor = (
  output: RgbColor,
  target: RgbColor,
  amount: number,
): void => {
  output[0] = lerp(output[0], target[0], amount)
  output[1] = lerp(output[1], target[1], amount)
  output[2] = lerp(output[2], target[2], amount)
}
