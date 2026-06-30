# MYCROFT Neural Orb UI

A cinematic, microphone-reactive interface for the TARS/MYCROFT assistant.
The orb, background plasma, particle field, HUD rings, bloom, and telemetry all
respond independently to live frequency data. Everything runs locally in the
browser with no paid APIs and no backend.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- Chrome or Edge recommended
- A WebGL 2-capable GPU
- A microphone for live audio mode

If `node` or `npm` is not recognized on Windows, install Node.js LTS and then
restart PowerShell or the VS Code terminal:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact --scope user
```

## Install and run

```powershell
cd C:\Users\vasav\OneDrive\Documents\ui_va\ui_2
npm install
npm run dev
```

Open the local URL shown by Vite, normally
[http://127.0.0.1:5173](http://127.0.0.1:5173).

Other commands:

```powershell
npm run build
npm run preview
```

`npm run build` writes the production bundle to `dist/`.

## Microphone permission

Microphone permission is requested only when **Start microphone** is pressed.
Browsers permit microphone capture on secure origins; `127.0.0.1` and
`localhost` are treated as secure for local development.

The stream is connected directly to a Web Audio `AnalyserNode`. It is never
recorded, uploaded, or sent to an API. **Stop** cancels the analysis loop,
stops every media track, disconnects the source, and closes the audio context.

If permission is blocked, allow microphone access in the browser's site
settings and reload the page.

## Controls

- **Start microphone / Stop** — control the browser audio stream.
- **State override** — preview Idle, Listening, Voice Detected, Thinking,
  Speaking, and Shutdown. Starting the microphone returns control to
  automatic audio mode.

Input sensitivity is fixed at `2.0×`.

The base spectrum is fixed to white. Assistant states can still add their
state-specific accent colors.

## Architecture

```text
src/
├── App.jsx                         Scene and assistant state orchestration
├── main.jsx                        React entry point
├── components/
│   ├── Background.jsx              Full-screen procedural energy field
│   ├── Controls.jsx                Microphone and state controls
│   ├── HudOverlay.jsx              Orbital scanner rings and control overlay
│   ├── Orb.jsx                     Layered shells, core, filaments, ripples
│   ├── Particles.jsx               GPU-animated reactive particle field
│   ├── PerformanceProbe.jsx        Low-frequency FPS sampling
│   └── ShootingStars.jsx           Timed background meteors and trails
├── config/
│   └── visuals.js                  State and fixed white visual configuration
├── hooks/
│   └── useMicrophone.js            Web Audio capture and spectrum analysis
├── shaders/
│   ├── background.vert.glsl
│   ├── background.frag.glsl
│   ├── orb.vert.glsl
│   ├── orb.frag.glsl
│   ├── particles.vert.glsl
│   ├── particles.frag.glsl
│   ├── shootingStar.vert.glsl
│   └── shootingStar.frag.glsl
└── styles/
    └── global.css                  HUD, controls, responsive presentation
```

## Rendering pipeline

The React Three Fiber canvas renders these layers in order:

1. `Background.jsx` draws a full-screen GLSL field with FBM noise, flowing
   ribbons, plasma currents, stars, and radial audio shockwaves.
2. `ShootingStars.jsx` occasionally sends a softly glowing procedural meteor
   across the background.
3. `Particles.jsx` renders one `THREE.Points` draw call. Vertex shaders handle
   drift, orbit, and audio bursts on the GPU.
4. `Orb.jsx` combines:
   - a deforming internal core;
   - three transparent procedural energy shells;
   - rotating torus-knot filaments;
   - expanding reactive rings.
5. Post-processing applies selective bloom and vignette.
6. `HudOverlay.jsx` renders the lightweight DOM/SVG cockpit layer above the
   canvas.

The scene uses no texture files. All orb and background detail is procedural.

### Orb shaders

`orb.vert.glsl` uses layered simplex noise, polar waves, frequency-specific
deformation, and breathing motion. Bass affects broad surface movement, mids
drive ripples, and treble drives fine detail.

`orb.frag.glsl` combines fresnel edges, moving plasma, scanning bands,
filament masks, layer-specific opacity, and HDR radiance for selective bloom.

### Background shaders

`background.frag.glsl` builds multiple FBM fields and warps them into energy
streams. Voice energy increases current brightness and speed. Audio amplitude
also creates outward shockwaves while treble increases star activity.

### Particle shaders

Particles orbit and drift entirely in the vertex shader. Volume and spectral
flux push particles outward and increase point size, avoiding per-frame React
updates or hundreds of individual meshes.

## Microphone processing

`useMicrophone.js` uses a 1024-sample FFT and calculates:

- RMS volume with a small noise floor;
- bass, mid, and treble band energy;
- positive spectral flux for transient detection;
- 24 logarithmically distributed spectrum bands;
- voice detection with separate activation and release thresholds.

Fast attack and slower release smoothing keep movement responsive without
jitter. React telemetry updates at roughly 12 Hz, while shader values are
passed through a mutable ref and update every rendered frame.

## Raspberry Pi 5 performance

The project avoids per-frame React state for animation, shares orb geometry,
uses one point-cloud draw call, disables MSAA, and caps device pixel ratio.
Devices reporting four or fewer logical cores automatically use:

- DPR 1;
- a reduced particle count;
- lower post-processing resolution.

For additional headroom, reduce the particle count in `Particles.jsx`, lower
the icosahedron detail values in `Orb.jsx`, or remove the bloom composer in
`App.jsx`.

## Python backend integration

The frontend exposes a stable browser API:

```javascript
window.mycroftUI.setState('idle')
window.mycroftUI.setState('listening')
window.mycroftUI.setState('voice-detected')
window.mycroftUI.setState('thinking')
window.mycroftUI.setState('speaking')
window.mycroftUI.setState('shutdown')
window.mycroftUI.getDiagnostics()
```

`shutdown` decelerates the orb, internal filaments, reactive rings, and HUD
into fixed resting positions. It drains the foreground to a static grey state
while the independent background stars and shooting stars continue moving.
Returning to `idle` runs the corresponding power-up transition.

External audio frames can also drive the visual system:

```javascript
window.mycroftUI.pushAudioFrame({
  volume: 0.42,
  frequency: [0.1, 0.15, 0.3, 0.8, 0.4],
  flux: 0.24,
})
```

Equivalent browser events are supported:

```javascript
window.dispatchEvent(
  new CustomEvent('mycroft:state', {
    detail: { state: 'thinking' },
  }),
)

window.dispatchEvent(
  new CustomEvent('mycroft:audioframe', {
    detail: { volume: 0.42, frequency: [0.1, 0.3, 0.8] },
  }),
)
```

### WebSocket bridge

When the Python backend is ready, add a small bridge in `App.jsx` or a
dedicated hook:

```javascript
const socket = new WebSocket('ws://127.0.0.1:8765')

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'state') {
    window.mycroftUI.setState(message.state)
  }

  if (message.type === 'audio') {
    window.mycroftUI.pushAudioFrame(message)
  }
})
```

Recommended backend messages:

```json
{"type":"state","state":"listening"}
```

```json
{
  "type": "audio",
  "volume": 0.42,
  "frequency": [0.08, 0.13, 0.31, 0.74],
  "flux": 0.18
}
```

Keep WebSocket messages focused on assistant state and normalized audio
features. The rendering loop should remain frontend-owned.

## Future STT, LLM, and TTS

The Python assistant should own the interaction pipeline:

```text
microphone → STT → LLM / tools → TTS
                 ↓
          WebSocket state events
                 ↓
              this UI
```

Suggested state transitions:

- STT opens the microphone: `listening`
- speech crosses the detector threshold: `voice-detected`
- transcript is sent to the LLM: `thinking`
- TTS playback begins: `speaking`
- playback finishes: `idle`
- assistant shutdown begins: `shutdown`

For TTS-reactive visuals, either send normalized playback frequency frames
from Python or route a browser audio element through another Web Audio
`AnalyserNode`. No STT, LLM, or TTS provider is coupled to this project yet.
