export const SETTINGS = {
  renderer: {
    maxPixelRatio: 1.5,
    maxFrameDelta: 0.05,
    background: '#000000',
    backgroundHalo: '#000000',
  },
  orb: {
    viewportScale: 0.26,
    minRadius: 100,
    maxRadius: 220,
    textureSize: 512,
    breathingAmount: 0.006,
    breathingSpeed: 0.72,
    audioPulseAmount: 0.012,
  },
  particles: {
    count: 640,
    widthRatio: 0.84,
    maxSpan: 1040,
    minSpan: 340,
    minRadius: 0.72,
    maxRadius: 1.62,
    glowFraction: 0.085,
    glowScale: 2.5,
    paletteSize: 8,
    paletteRefreshMs: 80,
  },
  transitions: {
    response: 4.4,
    thinkingResponse: 1.35,
  },
  audio: {
    fftSize: 512,
    smoothing: 0.76,
    waveformSamples: 128,
  },
} as const
