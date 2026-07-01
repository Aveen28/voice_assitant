export const BASE_THEME = {
  primary: '#dcefff',
  secondary: '#6e9fbf',
  accent: '#ffffff',
  deep: '#061016',
}

export const STATE_VISUALS = {
  idle: {
    label: 'Idle',
    code: 'STANDBY',
    energy: 0.16,
    speed: 0.32,
    deformation: 0.22,
    scale: 0.94,
    bloom: 0.62,
  },
  listening: {
    label: 'Listening',
    code: 'ACQUIRING',
    energy: 0.48,
    speed: 0.68,
    deformation: 0.48,
    scale: 1,
    bloom: 0.88,
  },
  'voice-detected': {
    label: 'Voice detected',
    code: 'SIGNAL LOCK',
    energy: 1,
    speed: 1.35,
    deformation: 1,
    audioDeformation: 0.7,
    scale: 1.04,
    bloom: 1.2,
  },
  thinking: {
    label: 'Thinking',
    code: 'SYNTHESIZING',
    energy: 0.72,
    speed: 6,
    deformation: 0.78,
    scale: 0.98,
    bloom: 1,
  },
  speaking: {
    label: 'Speaking',
    code: 'TRANSMITTING',
    energy: 0.9,
    speed: 1.12,
    deformation: 0.7,
    scale: 1.06,
    bloom: 1.12,
  },
  shutdown: {
    label: 'Shutdown',
    code: 'OFFLINE',
    energy: 0,
    speed: 0,
    deformation: 0,
    scale: 0.91,
    bloom: 0.62,
    power: 0,
  },
}

export const STATE_NAMES = Object.keys(STATE_VISUALS)

export function normalizeState(value) {
  const state = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')

  return STATE_VISUALS[state] ? state : null
}
