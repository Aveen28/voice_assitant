import { SETTINGS } from '../config/settings'

export class MicrophoneInput {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null

  get active(): boolean {
    return this.stream?.active ?? false
  }

  async start(): Promise<AnalyserNode> {
    await this.stop()

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone input is not available in this browser')
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    })

    this.context = new AudioContext({ latencyHint: 'interactive' })
    await this.context.resume()
    this.source = this.context.createMediaStreamSource(this.stream)
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = SETTINGS.audio.fftSize
    this.analyser.smoothingTimeConstant = SETTINGS.audio.smoothing
    this.source.connect(this.analyser)

    return this.analyser
  }

  async stop(): Promise<void> {
    this.source?.disconnect()
    this.analyser?.disconnect()
    this.stream?.getTracks().forEach((track) => track.stop())

    if (this.context && this.context.state !== 'closed') {
      await this.context.close()
    }

    this.source = null
    this.analyser = null
    this.stream = null
    this.context = null
  }
}
