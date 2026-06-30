precision highp float;

uniform vec3 uPrimary;
uniform vec3 uAccent;

varying float vAlpha;
varying float vSeed;

void main() {
  vec2 point = gl_PointCoord - 0.5;
  float distanceToCenter = length(point);

  if (distanceToCenter > 0.5) {
    discard;
  }

  float core = smoothstep(0.5, 0.0, distanceToCenter);
  float glow = pow(core, 2.2);
  vec3 color = mix(uPrimary, uAccent, vSeed * 0.7 + glow * 0.3);

  gl_FragColor = vec4(color * (0.75 + glow * 2.2), glow * vAlpha);
}
