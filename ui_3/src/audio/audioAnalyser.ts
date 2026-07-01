import type { AssistantState } from '../config/states'
import { SETTINGS } from '../config/settings'
import { clamp } from '../utils/math'

export interface AudioFrame {
  readonly waveform: Float32Array
  energy: number
  bass: number
  mid: number
  treble: number
  peak: number
}

const SIMULATED_LEVELS: Record<AssistantState, number> = {
  idle: 0.05,
  listening: 0.32,
  thinking: 0.08,
  speaking: 0.58,
  shutdown: 0,
}

export class AudioAnalyser {
  private node: AnalyserNode | null = null
  private timeData = new Uint8Array(SETTINGS.audio.fftSize)
  private frequencyData = new Uint8Array(SETTINGS.audio.fftSize / 2)
  private readonly frame: AudioFrame = {
    waveform: new Float32Array(SETTINGS.audio.waveformSamples),
    energy: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    peak: 0,
  }

  attach(node: AnalyserNode): void {
    this.node = node
    this.timeData = new Uint8Array(node.fftSize)
    this.frequencyData = new Uint8Array(node.frequencyBinCount)
  }

  detach(): void {
    this.node = null
  }

  sample(time: number, state: AssistantState): Readonly<AudioFrame> {
    if (this.node) {
      this.sampleLive()
    } else {
      this.sampleSimulated(time, state)
    }

    return this.frame
  }

  private sampleLive(): void {
    const node = this.node

    if (!node) {
      return
    }

    node.getByteTimeDomainData(this.timeData)
    node.getByteFrequencyData(this.frequencyData)

    let energySum = 0
    const waveform = this.frame.waveform
    const sampleStep = this.timeData.length / waveform.length

    for (let index = 0; index < waveform.length; index += 1) {
      const sourceIndex = Math.floor(index * sampleStep)
      const value = (this.timeData[sourceIndex] - 128) / 128
      waveform[index] = value
      energySum += value * value
    }

    const rawEnergy = clamp(Math.sqrt(energySum / waveform.length) * 3.2, 0, 1)
    const bassEnd = Math.floor(this.frequencyData.length * 0.1)
    const midEnd = Math.floor(this.frequencyData.length * 0.42)
    const bass = this.averageFrequency(0, bassEnd)
    const mid = this.averageFrequency(bassEnd, midEnd)
    const treble = this.averageFrequency(midEnd, this.frequencyData.length)

    this.frame.energy +=
      (rawEnergy - this.frame.energy) * (rawEnergy > this.frame.energy ? 0.34 : 0.11)
    this.frame.bass += (bass - this.frame.bass) * 0.16
    this.frame.mid += (mid - this.frame.mid) * 0.16
    this.frame.treble += (treble - this.frame.treble) * 0.14
    this.frame.peak = Math.max(this.frame.energy, this.frame.peak * 0.94)
  }

  private sampleSimulated(time: number, state: AssistantState): void {
    const level = SIMULATED_LEVELS[state]
    const cadence =
      state === 'speaking'
        ? 0.72 + Math.sin(time * 6.1) * 0.22 + Math.sin(time * 11.7) * 0.1
        : state === 'listening'
          ? 0.68 + Math.sin(time * 5.3) * 0.2 + Math.sin(time * 10.1) * 0.08
        : 0.78 + Math.sin(time * 2.2) * 0.14
    const targetEnergy = clamp(level * cadence, 0, 1)
    const waveform = this.frame.waveform

    for (let index = 0; index < waveform.length; index += 1) {
      const phase = index / waveform.length
      waveform[index] =
        Math.sin(phase * 18 + time * 3.1) * 0.54 +
        Math.sin(phase * 41 - time * 1.7) * 0.2 +
        Math.sin(phase * 7 + time * 4.3) * 0.12
    }

    this.frame.energy += (targetEnergy - this.frame.energy) * 0.055
    this.frame.bass += (targetEnergy * 0.9 - this.frame.bass) * 0.05
    this.frame.mid += (targetEnergy * 0.72 - this.frame.mid) * 0.05
    this.frame.treble += (targetEnergy * 0.46 - this.frame.treble) * 0.05
    this.frame.peak = Math.max(this.frame.energy, this.frame.peak * 0.96)
  }

  private averageFrequency(start: number, end: number): number {
    let sum = 0

    for (let index = start; index < end; index += 1) {
      sum += this.frequencyData[index]
    }

    return end > start ? sum / (end - start) / 255 : 0
  }
}
