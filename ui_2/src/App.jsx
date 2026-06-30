import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  Bloom,
  EffectComposer,
  Vignette,
} from '@react-three/postprocessing'
import * as THREE from 'three'
import { Background } from './components/Background'
import { HudOverlay } from './components/HudOverlay'
import { Orb } from './components/Orb'
import { PerformanceProbe } from './components/PerformanceProbe'
import {
  BASE_THEME,
  normalizeState,
  STATE_VISUALS,
} from './config/visuals'
import { PERFORMANCE_PROFILE } from './config/performance'
import { useMicrophone } from './hooks/useMicrophone'

const STATE_ACCENTS = {
  'voice-detected': '#60ffe0',
  thinking: '#bc6cff',
  speaking: '#ffb257',
}

const SHUTDOWN_THEME = {
  primary: '#858b90',
  secondary: '#303438',
  accent: '#a8adb1',
  deep: '#030506',
}

function MycroftScene({ audioRef, onFpsUpdate, state, theme, visual }) {
  return (
    <>
      <Background audioRef={audioRef} visual={visual} theme={theme} />
      <Orb
        audioRef={audioRef}
        visual={visual}
        theme={theme}
        state={state}
      />
      <PerformanceProbe onUpdate={onFpsUpdate} />
      <EffectComposer
        multisampling={0}
        enableNormalPass={false}
        resolutionScale={PERFORMANCE_PROFILE.bloomResolution}
      >
        <Bloom
          intensity={visual.bloom}
          luminanceThreshold={0.42}
          luminanceSmoothing={0.24}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.08} darkness={0.82} />
      </EffectComposer>
    </>
  )
}

export default function App() {
  const [state, setState] = useState('idle')
  const [controlMode, setControlMode] = useState('microphone')
  const stateRef = useRef(state)
  const fpsRef = useRef(0)

  const {
    applyExternalFrame,
    audioRef,
    error,
    isListening,
    isRequesting,
    metrics,
    start,
    stop,
  } = useMicrophone()

  const visual = STATE_VISUALS[state]
  const theme = useMemo(
    () =>
      state === 'shutdown'
        ? SHUTDOWN_THEME
        : {
            ...BASE_THEME,
            accent: STATE_ACCENTS[state] || BASE_THEME.accent,
            secondary:
              state === 'thinking' ? '#7131d4' : BASE_THEME.secondary,
          },
    [state],
  )

  useEffect(() => {
    stateRef.current = state
    window.dispatchEvent(
      new CustomEvent('mycroft:statechange', {
        detail: { state },
      }),
    )
  }, [state])

  useEffect(() => {
    if (controlMode !== 'microphone') return

    if (!isListening) {
      setState('idle')
    } else {
      setState(metrics.voiceDetected ? 'voice-detected' : 'listening')
    }
  }, [controlMode, isListening, metrics.voiceDetected])

  const handleStart = useCallback(async () => {
    setControlMode('microphone')
    const started = await start()

    if (started) {
      setState('listening')
    }
  }, [start])

  const handleStop = useCallback(async () => {
    await stop()
    setControlMode('microphone')
    setState('idle')
  }, [stop])

  const handleStateChange = useCallback((nextState) => {
    const normalizedState = normalizeState(nextState)
    if (!normalizedState) return false

    setControlMode('manual')
    setState(normalizedState)
    return true
  }, [])

  const handleFpsUpdate = useCallback((value) => {
    fpsRef.current = value
  }, [])

  useEffect(() => {
    const api = Object.freeze({
      setState: handleStateChange,
      getState: () => stateRef.current,
      pushAudioFrame: applyExternalFrame,
      startMicrophone: handleStart,
      stopMicrophone: handleStop,
      getDiagnostics: () => ({
        fps: fpsRef.current,
        audio: { ...audioRef.current },
        performanceProfile: PERFORMANCE_PROFILE.name,
      }),
    })

    const stateEventHandler = (event) => {
      handleStateChange(event.detail?.state)
    }
    const audioEventHandler = (event) => {
      applyExternalFrame(event.detail)
    }

    window.mycroftUI = api
    window.addEventListener('mycroft:state', stateEventHandler)
    window.addEventListener('mycroft:audioframe', audioEventHandler)

    return () => {
      window.removeEventListener('mycroft:state', stateEventHandler)
      window.removeEventListener('mycroft:audioframe', audioEventHandler)
      if (window.mycroftUI === api) {
        delete window.mycroftUI
      }
    }
  }, [
    applyExternalFrame,
    handleStart,
    handleStateChange,
    handleStop,
  ])

  return (
    <main className="app-shell">
      <div className="scene-layer">
        <Canvas
          dpr={PERFORMANCE_PROFILE.dpr}
          camera={{
            position: [0, 0, 7.4],
            fov: 42,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: false,
            alpha: false,
            depth: true,
            stencil: false,
            powerPreference: 'high-performance',
          }}
          fallback={
            <div className="webgl-fallback">
              WebGL is required to render the MYCROFT interface.
            </div>
          }
          onCreated={({ gl }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.08
          }}
        >
          <MycroftScene
            audioRef={audioRef}
            onFpsUpdate={handleFpsUpdate}
            state={state}
            theme={theme}
            visual={visual}
          />
        </Canvas>
      </div>

      <HudOverlay
        error={error}
        isListening={isListening}
        isRequesting={isRequesting}
        onStart={handleStart}
        onStateChange={handleStateChange}
        onStop={handleStop}
        state={state}
        theme={theme}
      />
    </main>
  )
}
