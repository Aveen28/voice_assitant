import {
  STATE_PRESETS,
  type AssistantState,
  type VisualState,
} from '../config/states'
import { SETTINGS } from '../config/settings'
import { dampFactor, lerp, lerpColor } from '../utils/lerp'

const cloneVisualState = (state: VisualState): VisualState => ({
  ...state,
  orbColor: [...state.orbColor],
  orbAccent: [...state.orbAccent],
})

export class StateManager {
  private currentState: AssistantState = 'idle'
  private readonly visual = cloneVisualState(STATE_PRESETS.idle)

  get state(): AssistantState {
    return this.currentState
  }

  get currentVisual(): Readonly<VisualState> {
    return this.visual
  }

  setState(state: AssistantState): void {
    this.currentState = state
  }

  update(delta: number): Readonly<VisualState> {
    const target = STATE_PRESETS[this.currentState]
    const transitioningThinking =
      this.currentState === 'thinking' || this.visual.orbit > 0.005
    const response = transitioningThinking
      ? SETTINGS.transitions.thinkingResponse
      : SETTINGS.transitions.response
    const amount = dampFactor(response, delta)

    lerpColor(this.visual.orbColor, target.orbColor, amount)
    lerpColor(this.visual.orbAccent, target.orbAccent, amount)
    this.visual.glow = lerp(this.visual.glow, target.glow, amount)
    this.visual.orbOpacity = lerp(
      this.visual.orbOpacity,
      target.orbOpacity,
      amount,
    )
    this.visual.particleOpacity = lerp(
      this.visual.particleOpacity,
      target.particleOpacity,
      amount,
    )
    this.visual.amplitude = lerp(
      this.visual.amplitude,
      target.amplitude,
      amount,
    )
    this.visual.speed = lerp(this.visual.speed, target.speed, amount)
    this.visual.density = lerp(this.visual.density, target.density, amount)
    this.visual.coherence = lerp(
      this.visual.coherence,
      target.coherence,
      amount,
    )
    this.visual.audioResponse = lerp(
      this.visual.audioResponse,
      target.audioResponse,
      amount,
    )
    this.visual.orbit = lerp(this.visual.orbit, target.orbit, amount)
    this.visual.particleHue = lerp(
      this.visual.particleHue,
      target.particleHue,
      amount,
    )
    this.visual.particleSpread = lerp(
      this.visual.particleSpread,
      target.particleSpread,
      amount,
    )
    this.visual.particleSaturation = lerp(
      this.visual.particleSaturation,
      target.particleSaturation,
      amount,
    )
    this.visual.particleLightness = lerp(
      this.visual.particleLightness,
      target.particleLightness,
      amount,
    )

    return this.visual
  }
}
