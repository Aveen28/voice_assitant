import {
  STATE_LABELS,
  STATE_ORDER,
  type AssistantState,
} from '../config/states'

interface ControlCallbacks {
  onStateChange: (state: AssistantState) => void
  onMicrophoneStart: () => void
  onMicrophoneStop: () => void
}

export class ControlStrip {
  readonly element = document.createElement('section')
  private readonly stateButtons = new Map<AssistantState, HTMLButtonElement>()
  private readonly startButton = document.createElement('button')
  private readonly stopButton = document.createElement('button')
  private readonly modeLabel = document.createElement('span')

  constructor(callbacks: ControlCallbacks) {
    this.element.className = 'control-strip'
    this.element.setAttribute('aria-label', 'Assistant test controls')

    const audioGroup = document.createElement('div')
    audioGroup.className = 'control-group audio-controls'

    this.startButton.type = 'button'
    this.startButton.className = 'control-button microphone-button'
    this.startButton.textContent = 'Start microphone'
    this.startButton.addEventListener('click', callbacks.onMicrophoneStart)

    this.stopButton.type = 'button'
    this.stopButton.className = 'control-button'
    this.stopButton.textContent = 'Stop'
    this.stopButton.addEventListener('click', callbacks.onMicrophoneStop)

    audioGroup.append(this.startButton, this.stopButton)

    const divider = document.createElement('span')
    divider.className = 'control-divider'
    divider.setAttribute('aria-hidden', 'true')

    const stateGroup = document.createElement('div')
    stateGroup.className = 'control-group state-controls'

    for (const state of STATE_ORDER) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'control-button state-button'
      button.textContent = STATE_LABELS[state]
      button.dataset.state = state
      button.setAttribute('aria-pressed', String(state === 'idle'))
      button.addEventListener('click', () => callbacks.onStateChange(state))
      this.stateButtons.set(state, button)
      stateGroup.append(button)
    }

    this.modeLabel.className = 'mode-label'
    this.modeLabel.textContent = 'Demo signal'
    this.element.append(audioGroup, divider, stateGroup, this.modeLabel)
  }

  setState(state: AssistantState): void {
    for (const [buttonState, button] of this.stateButtons) {
      const active = buttonState === state
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    }
  }

  setMicrophoneStatus(
    status: 'demo' | 'starting' | 'live' | 'unavailable',
  ): void {
    const labels = {
      demo: 'Demo signal',
      starting: 'Requesting access',
      live: 'Microphone live',
      unavailable: 'Demo fallback',
    }

    this.modeLabel.textContent = labels[status]
    this.modeLabel.dataset.status = status
    this.startButton.disabled = status === 'starting' || status === 'live'
    this.stopButton.disabled = status === 'starting'
    this.startButton.classList.toggle('is-active', status === 'live')
  }
}
