export type AssistantState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'shutdown'

export type RgbColor = [number, number, number]

export interface VisualState {
  orbColor: RgbColor
  orbAccent: RgbColor
  glow: number
  orbOpacity: number
  particleOpacity: number
  amplitude: number
  speed: number
  density: number
  coherence: number
  audioResponse: number
  orbit: number
  particleHue: number
  particleSpread: number
  particleSaturation: number
  particleLightness: number
}

export const STATE_ORDER: AssistantState[] = [
  'idle',
  'listening',
  'thinking',
  'speaking',
  'shutdown',
]

export const STATE_LABELS: Record<AssistantState, string> = {
  idle: 'Idle',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  shutdown: 'Shutdown',
}

export const STATE_PRESETS: Record<AssistantState, VisualState> = {
  idle: {
    orbColor: [20, 130, 220],
    orbAccent: [68, 225, 255],
    glow: 0.54,
    orbOpacity: 0.9,
    particleOpacity: 0.64,
    amplitude: 0.2,
    speed: 0.38,
    density: 0.74,
    coherence: 0.45,
    audioResponse: 0.14,
    orbit: 0,
    particleHue: 265,
    particleSpread: 150,
    particleSaturation: 94,
    particleLightness: 65,
  },
  listening: {
    orbColor: [24, 202, 166],
    orbAccent: [145, 255, 225],
    glow: 0.72,
    orbOpacity: 1,
    particleOpacity: 0.78,
    amplitude: 0.24,
    speed: 0.92,
    density: 0.92,
    coherence: 0.56,
    audioResponse: 1.45,
    orbit: 0,
    particleHue: 164,
    particleSpread: 34,
    particleSaturation: 92,
    particleLightness: 70,
  },
  thinking: {
    orbColor: [124, 52, 255],
    orbAccent: [211, 151, 255],
    glow: 0.76,
    orbOpacity: 0.98,
    particleOpacity: 0.88,
    amplitude: 0.24,
    speed: 1.24,
    density: 1,
    coherence: 0.92,
    audioResponse: 0.08,
    orbit: 1,
    particleHue: 282,
    particleSpread: 72,
    particleSaturation: 94,
    particleLightness: 68,
  },
  speaking: {
    orbColor: [242, 139, 22],
    orbAccent: [255, 236, 154],
    glow: 0.84,
    orbOpacity: 1,
    particleOpacity: 0.96,
    amplitude: 0.28,
    speed: 1.16,
    density: 1,
    coherence: 0.52,
    audioResponse: 1.55,
    orbit: 0,
    particleHue: 34,
    particleSpread: 66,
    particleSaturation: 96,
    particleLightness: 68,
  },
  shutdown: {
    orbColor: [92, 98, 110],
    orbAccent: [137, 143, 154],
    glow: 0.05,
    orbOpacity: 0.2,
    particleOpacity: 0,
    amplitude: 0,
    speed: 0.12,
    density: 0,
    coherence: 1,
    audioResponse: 0,
    orbit: 0,
    particleHue: 220,
    particleSpread: 0,
    particleSaturation: 8,
    particleLightness: 58,
  },
}
