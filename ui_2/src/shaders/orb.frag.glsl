precision highp float;

uniform float uTime;
uniform float uAudio;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uEnergy;
uniform float uLayer;
uniform float uOpacity;
uniform float uPower;
uniform vec3 uPrimary;
uniform vec3 uSecondary;
uniform vec3 uAccent;

varying vec3 vWorldPosition;
varying vec3 vNormalWorld;
varying vec3 vObjectPosition;
varying float vNoise;
varying float vRipple;

void main() {
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float facing = max(dot(viewDirection, normalize(vNormalWorld)), 0.0);
  float fresnel = pow(1.0 - facing, 2.25);
  float innerFresnel = pow(1.0 - facing, 0.65);
  float plasma =
    sin(vNoise * 9.0 + uTime * 1.4 + vObjectPosition.y * 4.0) * 0.5 + 0.5;
  float filaments = smoothstep(
    0.58,
    0.96,
    sin(
      vNoise * 18.0 +
      vRipple * 2.5 +
      vObjectPosition.x * 8.0 -
      uTime * (1.6 + uMid * 2.4)
    ) * 0.5 + 0.5
  );
  float scan = sin(vObjectPosition.y * 25.0 - uTime * 3.0) * 0.5 + 0.5;
  float impact = smoothstep(0.18, 0.9, uAudio + uBass * 0.45);
  float colorFlow = clamp(
    plasma * 0.52 + vNoise * 0.24 + uTreble * 0.32 + uLayer * 0.1,
    0.0,
    1.0
  );

  vec3 color = mix(uSecondary, uPrimary, colorFlow) *
    (0.18 + plasma * 0.25);
  color = mix(
    color,
    uAccent * 0.72,
    filaments * (0.04 + uPower * 0.14 + uEnergy * 0.22)
  );
  color += uPrimary * fresnel * (0.18 + uPower * 0.37 + uEnergy * 0.88);
  color += uAccent * filaments * (0.035 + uPower * 0.165 + uAudio * 0.82);
  color += uSecondary * scan * uTreble * 0.15 * uPower;

  float radiance =
    0.28 +
    uPower * 0.3 +
    uEnergy * 0.38 +
    impact * 0.72 +
    fresnel * 0.52 +
    filaments * 0.3;
  color *= radiance;
  color *= mix(1.0, 1.48, smoothstep(1.45, 1.8, uLayer));

  float shellAlpha =
    0.2 +
    fresnel * 0.58 +
    filaments * 0.18 +
    innerFresnel * uAudio * 0.14;
  float coreAlpha = 0.58 + uPower * 0.2 + plasma * (0.08 + uPower * 0.12);
  float alpha = mix(shellAlpha, coreAlpha, smoothstep(1.45, 1.8, uLayer));

  gl_FragColor = vec4(color, clamp(alpha * uOpacity, 0.0, 1.0));
}
