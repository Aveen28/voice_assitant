precision highp float;

uniform float uTime;
uniform float uAudio;
uniform float uFlux;
uniform float uEnergy;
uniform float uPixelRatio;

attribute float aSeed;
attribute float aSize;

varying float vAlpha;
varying float vSeed;

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

void main() {
  vec3 transformed = position;
  float drift = uTime * (0.025 + aSeed * 0.06 + uEnergy * 0.025);
  transformed.xz = rotate2d(drift) * transformed.xz;
  transformed.xy += vec2(
    sin(uTime * 0.16 + aSeed * 31.0),
    cos(uTime * 0.13 + aSeed * 19.0)
  ) * (0.025 + aSeed * 0.06);

  float burst = uAudio * (0.15 + uFlux * 0.75) * (0.35 + aSeed);
  transformed += normalize(transformed + vec3(0.001)) * burst;

  vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * modelViewPosition;
  gl_PointSize = min(
    11.0,
    (aSize + uAudio * 4.5 + uFlux * 6.0) *
    uPixelRatio *
    (5.5 / max(1.0, -modelViewPosition.z))
  );

  vAlpha = 0.25 + aSeed * 0.48 + uEnergy * 0.24 + uAudio * 0.35;
  vSeed = aSeed;
}
