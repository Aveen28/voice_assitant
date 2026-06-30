precision highp float;

uniform vec3 uColor;
uniform float uOpacity;
uniform float uAspect;

varying vec2 vUv;

void main() {
  float along = clamp(vUv.x / 0.92, 0.0, 1.0);
  float crossDistance = abs(vUv.y - 0.5);
  float width = mix(0.018, 0.15, pow(along, 1.5));
  float body =
    smoothstep(0.0, 0.06, vUv.x) *
    (1.0 - smoothstep(0.9, 0.95, vUv.x));
  float taper = pow(along, 1.35);
  float core =
    1.0 - smoothstep(width * 0.22, width * 0.62, crossDistance);
  float glow =
    1.0 - smoothstep(width, width * 2.75, crossDistance);

  vec2 headOffset = vec2(
    (vUv.x - 0.92) * uAspect,
    vUv.y - 0.5
  );
  float headCore =
    1.0 - smoothstep(0.035, 0.16, length(headOffset));
  float headGlow =
    1.0 - smoothstep(0.12, 0.42, length(headOffset));
  float trail = body * taper * (core * 0.82 + glow * 0.2);
  float alpha = (trail + headCore + headGlow * 0.22) * uOpacity;

  if (alpha < 0.002) {
    discard;
  }

  vec3 color = uColor * (
    0.72 +
    core * taper * 0.95 +
    headCore * 2.4 +
    headGlow * 0.42
  );

  gl_FragColor = vec4(color, alpha);
}
