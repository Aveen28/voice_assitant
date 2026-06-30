import { useCallback, useEffect, useRef, useState } from 'react'

const EMPTY_SPECTRUM = Array.from({ length: 24 }, () => 0)
const INPUT_SENSITIVITY = 2

const EMPTY_AUDIO = {
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  flux: 0,
  voiceDetected: false,
  spectrum: EMPTY_SPECTRUM,
}

function averageRange(values, start, end) {
  let total = 0
  const safeEnd = Math.min(end, values.length)

  for (let index = start; index < safeEnd; index += 1) {
    total += values[index]
  }

  return safeEnd > start ? total / (safeEnd - start) / 255 : 0
}

function createSpectrum(values) {
  const spectrum = []
  const minBin = 1
  const maxBin = Math.min(220, values.length - 1)

  for (let index = 0; index < 24; index += 1) {
    const start = Math.max(
      minBin,
      Math.floor(minBin * (maxBin / minBin) ** (index / 24)),
    )
    const end = Math.max(
      start + 1,
      Math.floor(minBin * (maxBin / minBin) ** ((index + 1) / 24)),
    )
    spectrum.push(averageRange(values, start, end))
  }

  return spectrum
}

export function useMicrophone() {
  const audioRef = useRef({ ...EMPTY_AUDIO })
  const streamRef = useRef(null)
  const contextRef = useRef(null)
  const sourceRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const previousFrequencyRef = useRef(null)
  const lastMetricsUpdateRef = useRef(0)

  const [metrics, setMetrics] = useState(EMPTY_AUDIO)
  const [isListening, setIsListening] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [deviceLabel, setDeviceLabel] = useState('Default input')
  const [error, setError] = useState('')

  const releaseResources = useCallback(async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())

    try {
      sourceRef.current?.disconnect()
    } catch {
      // The source may already be disconnected by the browser.
    }

    if (contextRef.current && contextRef.current.state !== 'closed') {
      try {
        await contextRef.current.close()
      } catch {
        // The context may already be closing during page teardown.
      }
    }

    streamRef.current = null
    sourceRef.current = null
    analyserRef.current = null
    contextRef.current = null
    previousFrequencyRef.current = null
  }, [])

  const stop = useCallback(async () => {
    await releaseResources()
    audioRef.current = { ...EMPTY_AUDIO }
    setMetrics(EMPTY_AUDIO)
    setIsListening(false)
    setIsRequesting(false)
  }, [releaseResources])

  const start = useCallback(async () => {
    if (streamRef.current) return true

    setError('')
    setIsRequesting(true)

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access requires localhost or HTTPS.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext

      if (!AudioContextClass) {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('This browser does not support the Web Audio API.')
      }

      const context = new AudioContextClass()
      const analyser = context.createAnalyser()
      const source = context.createMediaStreamSource(stream)

      streamRef.current = stream
      contextRef.current = context
      sourceRef.current = source
      analyserRef.current = analyser

      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.72
      analyser.minDecibels = -92
      analyser.maxDecibels = -12
      source.connect(analyser)
      await context.resume()

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      const timeData = new Uint8Array(analyser.fftSize)
      const previousFrequency = new Uint8Array(analyser.frequencyBinCount)

      previousFrequencyRef.current = previousFrequency

      const trackLabel = stream.getAudioTracks()[0]?.label
      setDeviceLabel(trackLabel || 'Default input')
      setIsListening(true)
      setIsRequesting(false)

      const analyze = (timestamp) => {
        if (!analyserRef.current) return

        analyser.getByteFrequencyData(frequencyData)
        analyser.getByteTimeDomainData(timeData)

        let sumSquares = 0
        let fluxTotal = 0

        for (let index = 0; index < timeData.length; index += 1) {
          const sample = (timeData[index] - 128) / 128
          sumSquares += sample * sample
        }

        for (let index = 0; index < frequencyData.length; index += 1) {
          fluxTotal += Math.max(
            0,
            frequencyData[index] - previousFrequency[index],
          )
          previousFrequency[index] = frequencyData[index]
        }

        const rms = Math.sqrt(sumSquares / timeData.length)
        const targetVolume = Math.min(
          1,
          Math.max(0, rms - 0.008) * 10 * INPUT_SENSITIVITY,
        )
        const currentVolume = audioRef.current.volume
        const smoothing = targetVolume > currentVolume ? 0.34 : 0.1
        const volume =
          currentVolume + (targetVolume - currentVolume) * smoothing
        const bass = Math.min(
          1,
          averageRange(frequencyData, 1, 7) * INPUT_SENSITIVITY,
        )
        const mid = Math.min(
          1,
          averageRange(frequencyData, 7, 48) * INPUT_SENSITIVITY,
        )
        const treble = Math.min(
          1,
          averageRange(frequencyData, 48, 190) * INPUT_SENSITIVITY,
        )
        const flux = Math.min(
          1,
          (fluxTotal / frequencyData.length / 42) * INPUT_SENSITIVITY,
        )
        const wasDetected = audioRef.current.voiceDetected
        const voiceDetected = wasDetected
          ? volume > 0.045 || mid > 0.12
          : volume > 0.075 || mid > 0.2
        const spectrum = createSpectrum(frequencyData)

        audioRef.current = {
          volume,
          bass,
          mid,
          treble,
          flux,
          voiceDetected,
          spectrum,
        }

        if (timestamp - lastMetricsUpdateRef.current > 80) {
          setMetrics(audioRef.current)
          lastMetricsUpdateRef.current = timestamp
        }

        animationRef.current = requestAnimationFrame(analyze)
      }

      animationRef.current = requestAnimationFrame(analyze)
      return true
    } catch (caughtError) {
      await releaseResources()
      setIsListening(false)
      setIsRequesting(false)

      if (caughtError.name === 'NotAllowedError') {
        setError('Microphone blocked. Allow access in browser site settings.')
      } else if (caughtError.name === 'NotFoundError') {
        setError('No microphone input was found.')
      } else {
        setError(caughtError.message || 'Unable to start microphone.')
      }

      return false
    }
  }, [releaseResources])

  const applyExternalFrame = useCallback((frame) => {
    const incomingSpectrum = Array.isArray(frame?.frequency)
      ? frame.frequency.slice(0, 24).map((value) => Math.min(1, Number(value) || 0))
      : EMPTY_SPECTRUM
    const paddedSpectrum = [
      ...incomingSpectrum,
      ...EMPTY_SPECTRUM,
    ].slice(0, 24)
    const volume = Math.min(1, Math.max(0, Number(frame?.volume) || 0))

    audioRef.current = {
      volume,
      bass: paddedSpectrum.slice(0, 6).reduce((a, b) => a + b, 0) / 6,
      mid: paddedSpectrum.slice(6, 16).reduce((a, b) => a + b, 0) / 10,
      treble: paddedSpectrum.slice(16).reduce((a, b) => a + b, 0) / 8,
      flux: Number(frame?.flux) || 0,
      voiceDetected: volume > 0.075,
      spectrum: paddedSpectrum,
    }
    setMetrics(audioRef.current)
  }, [])

  useEffect(
    () => () => {
      releaseResources()
    },
    [releaseResources],
  )

  return {
    audioRef,
    metrics,
    isListening,
    isRequesting,
    deviceLabel,
    error,
    start,
    stop,
    applyExternalFrame,
  }
}
