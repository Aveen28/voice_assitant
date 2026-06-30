precision highp float;

uniform float uTime;
uniform float uAudio;
uniform float uBass;
uniform float uTreble;
uniform float uEnergy;
uniform float uSpeed;
uniform vec2 uResolution;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uDeep;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);

  for (int index = 0; index < 5; index++) {
    value += noise(p) * amplitude;
    p = rotation * p * 2.03 + 17.1;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv - 0.5;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  uv.x *= aspect;

  float time = uTime * (0.055 + uSpeed * 0.12);
  vec2 flowUv = uv * 1.35;
  float fieldA = fbm(flowUv * 1.55 + vec2(time, -time * 0.7));
  float fieldB = fbm(
    flowUv * 2.4 -
    vec2(time * 1.3, time * 0.45) +
    fieldA * 1.7
  );
  float fieldC = fbm(
    flowUv * 3.2 +
    vec2(-time * 0.8, time * 1.2) +
    fieldB
  );

  float ribbonA = abs(
    uv.y +
    sin(uv.x * 2.9 + time * 7.0) * 0.11 +
    (fieldA - 0.5) * 0.33
  );
  float ribbonB = abs(
    uv.y * 0.72 -
    uv.x * 0.16 +
    sin(uv.x * 4.2 - time * 5.0) * 0.08 +
    (fieldB - 0.5) * 0.25
  );
  float streamA = pow(max(0.0, 1.0 - ribbonA * 4.2), 5.0);
  float streamB = pow(max(0.0, 1.0 - ribbonB * 5.8), 7.0);
  float plasma = smoothstep(0.42, 0.92, fieldB * 0.68 + fieldC * 0.45);

  float radialDistance = length(uv);
  float shock = sin(
    radialDistance * 36.0 -
    uTime * (1.1 + uAudio * 6.5)
  );
  shock = smoothstep(0.84, 1.0, shock) *
    (1.0 - smoothstep(0.15, 1.2, radialDistance)) *
    (0.025 + uAudio * 0.18);

  vec2 starCell = floor((uv + vec2(time * 0.01, 0.0)) * 95.0);
  vec2 starLocal = fract((uv + vec2(time * 0.01, 0.0)) * 95.0) - 0.5;
  float starSeed = hash21(starCell);
  float stars = step(0.988 - uTreble * 0.008, starSeed);
  stars *= smoothstep(0.11, 0.0, length(starLocal));
  stars *= 0.25 + 0.75 * (
    sin(uTime * (0.5 + starSeed * 2.0) + starSeed * 30.0) * 0.5 + 0.5
  );
  vec3 color = uDeep * (0.18 + fieldA * 0.1);
  color += uSecondary * plasma * (0.025 + uEnergy * 0.065);
  color += uPrimary * streamA * (0.045 + uEnergy * 0.2 + uBass * 0.24);
  color += mix(uSecondary, uPrimary, 0.7) *
    streamB *
    (0.035 + uEnergy * 0.14);
  color += uPrimary * shock * 0.62;
  color += mix(vec3(0.55, 0.72, 1.0), uPrimary, 0.6) * stars * 0.72;

  float vignette = smoothstep(1.05, 0.18, radialDistance);
  color *= 0.34 + vignette * 0.62;

  gl_FragColor = vec4(color, 1.0);
}
