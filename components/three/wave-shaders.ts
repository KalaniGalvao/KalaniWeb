/**
 * GLSL for the hero's instanced cube field. The vertex shader displaces every
 * cube on the Y axis using a radial + directional sine wave (uTime idle +
 * uScroll on-scroll), and additionally "presses" cubes down near the mouse
 * (uMouse, in the grid's XZ space) so the field reacts to the cursor on hover.
 * The fragment shader does cheap stylised lighting: diffuse, a fresnel rim, an
 * emissive crest glow, and a brightening on pressed cubes — no scene lights, so
 * the whole field is a single instanced draw call.
 *
 * NOTE: `instanceMatrix` is auto-declared by three.js for ShaderMaterial when
 * the material is used on an InstancedMesh.
 */
export const heroVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform float uAmp;
  uniform float uFreq;
  uniform float uVelocity;

  uniform vec2  uMouse;        // pointer position projected onto the grid (XZ)
  uniform float uMouseActive;  // 0 when the pointer is off the hero, else 1
  uniform float uMouseRadius;  // press falloff radius
  uniform float uMousePress;   // max press depth

  varying float vWave;
  varying float vPress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    // Per-instance center (translation column of the instance matrix).
    vec3 center = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);

    float dist = length(center.xz);
    float phase = uTime * 1.4 + uScroll * 7.0;

    // Radial ripple from the field's center + a crossing directional wave.
    float wave = sin(dist * uFreq - phase) * uAmp;
    wave += sin(center.x * uFreq * 0.6 + phase * 0.5) * uAmp * 0.55;
    wave += cos(center.z * uFreq * 0.8 - phase * 0.7) * uAmp * 0.35;

    // Scroll velocity adds a momentary "kick" so flicks feel physical.
    wave += uVelocity * 0.12 * sin(dist * 0.5 - uTime);
    vWave = wave;

    // Cursor interaction: a single coordinated dip — a smooth distance-based
    // bell (no time term) so every cube under the pointer sinks together in
    // unison, deepest at the centre and easing to zero at the radius edge.
    float md = distance(center.xz, uMouse);
    float infl = 1.0 - smoothstep(0.0, uMouseRadius, md);
    infl = infl * infl * (3.0 - 2.0 * infl); // smootherstep falloff
    float press = infl * uMousePress * uMouseActive;
    vPress = infl * uMouseActive;

    // Place vertex in mesh space via the instance transform, then displace.
    vec4 transformed = instanceMatrix * vec4(position, 1.0);
    transformed.y += wave;
    transformed.y -= press;

    vec4 mvPosition = modelViewMatrix * transformed;
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const heroFragmentShader = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform vec3 uGlow;

  varying float vWave;
  varying float vPress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPosition);

    // Key light from upper-right — matches the hero's composition.
    vec3 L = normalize(vec3(0.45, 0.85, 0.55));
    float diffuse = clamp(dot(N, L), 0.0, 1.0);

    // Fresnel rim for that glassy, edge-lit PS2 cube look.
    float fresnel = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);

    float crest = clamp(vWave * 0.5 + 0.5, 0.0, 1.0);
    vec3 base = mix(uColorLow, uColorHigh, crest);

    vec3 color = base * (0.22 + 0.78 * diffuse);
    color += fresnel * uGlow * 0.9;
    color += smoothstep(0.62, 1.0, crest) * uGlow * 0.7; // glowing crests
    color += vPress * uGlow * 0.6;                        // pressed cubes light up

    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
