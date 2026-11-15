"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { HAZE_COOL, HAZE_HIGH, HAZE_WARM, SUN_DIR } from "./earthShared";

const fragmentShader = /* glsl */ `
  uniform float uStrength;
  uniform mat4 uInvProj;
  uniform mat4 uCamWorld;
  uniform vec3 uSunDir;
  uniform vec3 uHazeCool;
  uniform vec3 uHazeWarm;
  uniform vec3 uHazeHigh;

  vec3 lhHazeColor(vec3 d) {
    float s = pow(max(dot(d, uSunDir), 0.0), 3.0);
    vec3 c = mix(uHazeCool, uHazeWarm, s * 0.75);
    return mix(c, uHazeHigh, smoothstep(0.05, 0.45, d.y));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
    vec3 col = inputColor.rgb;
    if (uStrength <= 0.001) { outputColor = inputColor; return; }

    if (depth < 0.99999) {
      vec4 ndc = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
      vec4 vp = uInvProj * ndc;
      vp /= vp.w;
      vec3 wp = (uCamWorld * vec4(vp.xyz, 1.0)).xyz;
      vec3 camPos = uCamWorld[3].xyz;
      vec3 d = wp - camPos;
      float dist = length(d);
      d /= max(dist, 1e-4);
      float h = exp(-max(wp.y + 1.6, 0.0) * 0.045);
      float haze = clamp(1.0 - exp(-max(dist - 18.0, 0.0) * 0.0021 * (0.45 + 0.55 * h)), 0.0, 0.96);
      col = mix(col, lhHazeColor(d), haze * uStrength);
    }

    // Launch-hall grade: gentle desaturation and a cool slate lift in the shadows (Deep Field palette)
    float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
    vec3 graded = mix(vec3(l), col, 0.86);
    graded += vec3(0.004, 0.006, 0.010) * (1.0 - smoothstep(0.0, 0.08, l));
    col = mix(col, graded, uStrength);

    outputColor = vec4(col, inputColor.a);
  }
`;

class LaunchAtmosphereEffect extends Effect {
  constructor() {
    super("LaunchAtmosphereEffect", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, THREE.Uniform>([
        ["uStrength", new THREE.Uniform(0)],
        ["uInvProj", new THREE.Uniform(new THREE.Matrix4())],
        ["uCamWorld", new THREE.Uniform(new THREE.Matrix4())],
        ["uSunDir", new THREE.Uniform(SUN_DIR.clone())],
        ["uHazeCool", new THREE.Uniform(HAZE_COOL.clone())],
        ["uHazeWarm", new THREE.Uniform(HAZE_WARM.clone())],
        ["uHazeHigh", new THREE.Uniform(HAZE_HIGH.clone())],
      ]),
    });
  }
}

/**
 * Opus pad scene · depth-based aerial perspective + launch-hall grade (beats 0–3 only, strength → 0 after).
 * Always mounted inside the EffectComposer so the merged effect pass never recompiles mid-scroll.
 */
export function LaunchAtmosphere() {
  const effect = useMemo(() => new LaunchAtmosphereEffect(), []);
  useEffect(() => () => effect.dispose(), [effect]);

  useFrame(({ camera }) => {
    const p = scrollState.current;
    const strength = 1 - smoothstep(3.35, 4.0, p);
    const u = effect.uniforms;
    u.get("uStrength")!.value = strength;
    if (strength <= 0.001) return;
    camera.updateMatrixWorld();
    (u.get("uInvProj")!.value as THREE.Matrix4).copy(camera.projectionMatrixInverse);
    (u.get("uCamWorld")!.value as THREE.Matrix4).copy(camera.matrixWorld);
  });

  return <primitive object={effect} dispose={null} />;
}
