import { AudioAnalyser } from './audio/audioAnalyser'
import { MicrophoneInput } from './audio/microphone'
import { SETTINGS } from './config/settings'
import type { AssistantState } from './config/states'
import { Renderer } from './render/renderer'
import { ControlStrip } from './ui/controls'
import { StateManager } from './ui/stateManager'

export class AssistantApp {
  private readonly canvas = document.createElement('canvas')
  private readonly stateManager = new StateManager()
  private readonly microphone = new MicrophoneInput()
  private readonly audioAnalyser = new AudioAnalyser()
  private readonly renderer: Renderer
  private readonly controls: ControlStrip
  private animationFrame = 0
  private previousTime = 0

  constructor(private readonly root: HTMLElement) {
    this.canvas.className = 'visualizer'
    this.canvas.setAttribute('aria-hidden', 'true')
    this.renderer = new Renderer(this.canvas)
    this.controls = new ControlStrip({
      onStateChange: (state) => this.setState(state),
      onMicrophoneStart: () => {
        void this.startMicrophone()
      },
      onMicrophoneStop: () => {
        void this.stopMicrophone()
      },
    })

    this.root.append(this.canvas, this.controls.element)

    this.controls.setState('idle')
    window.addEventListener('resize', this.handleResize, { passive: true })
    window.addEventListener('pagehide', this.handlePageHide)
  }

  start(): void {
    this.previousTime = performance.now()
    this.animationFrame = requestAnimationFrame(this.render)
  }

  private readonly render = (timeMs: number): void => {
    const delta = Math.min(
      (timeMs - this.previousTime) / 1000,
      SETTINGS.renderer.maxFrameDelta,
    )
    this.previousTime = timeMs

    const visual = this.stateManager.update(delta)
    const audio = this.audioAnalyser.sample(timeMs / 1000, this.stateManager.state)
    this.renderer.render(timeMs / 1000, visual, audio)
    this.animationFrame = requestAnimationFrame(this.render)
  }

  private setState(state: AssistantState): void {
    this.stateManager.setState(state)
    this.controls.setState(state)
  }

  private async startMicrophone(): Promise<void> {
    this.controls.setMicrophoneStatus('starting')

    try {
      const analyser = await this.microphone.start()
      this.audioAnalyser.attach(analyser)
      this.controls.setMicrophoneStatus('live')
      this.setState('listening')
    } catch {
      this.audioAnalyser.detach()
      this.controls.setMicrophoneStatus('unavailable')
      this.setState('idle')
    }
  }

  private async stopMicrophone(): Promise<void> {
    await this.microphone.stop()
    this.audioAnalyser.detach()
    this.controls.setMicrophoneStatus('demo')
    this.setState('idle')
  }

  private readonly handleResize = (): void => {
    this.renderer.resize()
  }

  private readonly handlePageHide = (): void => {
    cancelAnimationFrame(this.animationFrame)
    void this.microphone.stop()
  }
}
