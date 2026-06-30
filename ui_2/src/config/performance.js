const qualityOverride = new URLSearchParams(window.location.search).get(
  'quality',
)
const logicalCores = navigator.hardwareConcurrency || 8
const lowPower =
  qualityOverride === 'pi' ||
  qualityOverride === 'low' ||
  (qualityOverride !== 'high' && logicalCores <= 4)

export const PERFORMANCE_PROFILE = Object.freeze({
  name: lowPower ? 'pi' : 'high',
  lowPower,
  dpr: lowPower ? 0.75 : [1, 1.5],
  bloomResolution: lowPower ? 0.4 : 0.8,
  backgroundOctaves: lowPower ? 3 : 5,
  shellDetail: lowPower ? 4 : 5,
  coreDetail: lowPower ? 3 : 4,
})
