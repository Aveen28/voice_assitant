import { useEffect, useRef, useState } from 'react'
import { Controls } from './Controls'

export function HudOverlay({
  error,
  isListening,
  isRequesting,
  onStart,
  onStateChange,
  onStop,
  state,
  theme,
}) {
  const [powerPhase, setPowerPhase] = useState('')
  const previousStateRef = useRef(state)
  const phaseTimeoutRef = useRef()

  useEffect(() => {
    const previousState = previousStateRef.current
    previousStateRef.current = state

    if (state === 'shutdown' && previousState !== 'shutdown') {
      window.clearTimeout(phaseTimeoutRef.current)
      setPowerPhase('powering-down')
      phaseTimeoutRef.current = window.setTimeout(
        () => setPowerPhase(''),
        2400,
      )
    } else if (previousState === 'shutdown' && state !== 'shutdown') {
      window.clearTimeout(phaseTimeoutRef.current)
      setPowerPhase('powering-up')
      phaseTimeoutRef.current = window.setTimeout(
        () => setPowerPhase(''),
        2200,
      )
    }
  }, [state])

  useEffect(
    () => () => window.clearTimeout(phaseTimeoutRef.current),
    [],
  )

  return (
    <div
      className={`hud-overlay state-${state}`}
      style={{
        '--theme-primary': theme.primary,
        '--theme-secondary': theme.secondary,
        '--theme-accent': theme.accent,
      }}
    >
      <div
        className={`power-transition ${powerPhase}`}
        aria-hidden="true"
      >
        <span />
      </div>

      <Controls
        error={error}
        isListening={isListening}
        isRequesting={isRequesting}
        onStart={onStart}
        onStateChange={onStateChange}
        onStop={onStop}
        state={state}
      />
    </div>
  )
}
