import { useEffect, useRef, useState } from 'react'
import { Controls } from './Controls'

const HUD_PLAYBACK_RATES = {
  idle: 0.72,
  listening: 1.05,
  'voice-detected': 1.7,
  thinking: 9,
  speaking: 1.5,
  shutdown: 0,
}

const HUD_REST_PROGRESS = [0.04, 0.3, 0.62, 0.84]

function OrbitalHud({ state }) {
  const hudRef = useRef()
  const previousStateRef = useRef(state)

  useEffect(() => {
    const animatedElements = hudRef.current?.querySelectorAll(
      '.hud-orbit, .hud-scan',
    )
    const animations = Array.from(animatedElements ?? []).flatMap((element) =>
      element.getAnimations(),
    )

    if (!animations.length) return undefined

    const previousState = previousStateRef.current
    previousStateRef.current = state
    const targetRate = HUD_PLAYBACK_RATES[state] ?? 1
    const startingRates = animations.map((animation) => animation.playbackRate)
    const startedAt = performance.now()
    let animationFrame

    const easeInOut = (progress) =>
      progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

    const alignToRest = () => {
      const alignmentStartedAt = performance.now()
      const alignmentDuration = 900
      const alignment = animations.map((animation, index) => {
        const timingDuration = Number(animation.effect?.getTiming().duration)
        const duration =
          Number.isFinite(timingDuration) && timingDuration > 0
            ? timingDuration
            : 1000
        const currentTime = Number(animation.currentTime) || 0
        const desiredTime =
          HUD_REST_PROGRESS[index % HUD_REST_PROGRESS.length] * duration
        const nearestCycle = Math.round((currentTime - desiredTime) / duration)
        return {
          animation,
          currentTime,
          targetTime: desiredTime + nearestCycle * duration,
        }
      })

      const updateAlignment = (timestamp) => {
        const progress = Math.min(
          1,
          (timestamp - alignmentStartedAt) / alignmentDuration,
        )
        const eased = easeInOut(progress)

        alignment.forEach(({ animation, currentTime, targetTime }) => {
          animation.currentTime =
            currentTime + (targetTime - currentTime) * eased
          animation.playbackRate = 0
        })

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateAlignment)
        }
      }

      animationFrame = requestAnimationFrame(updateAlignment)
    }

    if (state === 'shutdown') {
      const duration = 1550
      const updateShutdownRate = (timestamp) => {
        const progress = Math.min(1, (timestamp - startedAt) / duration)
        const eased = easeInOut(progress)

        animations.forEach((animation, index) => {
          animation.playbackRate = startingRates[index] * (1 - eased)
        })

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateShutdownRate)
        } else {
          alignToRest()
        }
      }

      animationFrame = requestAnimationFrame(updateShutdownRate)
      return () => cancelAnimationFrame(animationFrame)
    }

    const accelerating = targetRate > Math.max(...startingRates)
    const duration =
      previousState === 'shutdown'
        ? 2100
        : accelerating
          ? 700
          : 2800

    const updateRate = (timestamp) => {
      const progress = Math.min(1, (timestamp - startedAt) / duration)
      const eased = easeInOut(progress)

      animations.forEach((animation, index) => {
        animation.playbackRate =
          startingRates[index] +
          (targetRate - startingRates[index]) * eased
      })

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateRate)
      }
    }

    animationFrame = requestAnimationFrame(updateRate)
    return () => cancelAnimationFrame(animationFrame)
  }, [state])

  return (
    <div ref={hudRef} className="orbital-hud" aria-hidden="true">
      <span className="hud-orbit hud-orbit-one" />
      <span className="hud-orbit hud-orbit-two" />
      <span className="hud-orbit hud-orbit-three" />
      <span className="hud-scan" />
      <i className="cardinal cardinal-north">N</i>
      <i className="cardinal cardinal-east">E</i>
      <i className="cardinal cardinal-south">S</i>
      <i className="cardinal cardinal-west">W</i>
      <svg className="hud-vector" viewBox="0 0 600 600">
        <circle cx="300" cy="300" r="286" />
        <circle cx="300" cy="300" r="246" />
        <path d="M300 5v22M300 573v22M5 300h22M573 300h22" />
        <path d="M94 95l16 16M490 490l16 16M94 505l16-16M490 110l16-16" />
      </svg>
    </div>
  )
}

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

      <OrbitalHud state={state} />

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
