"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

let cachedNoiseTex: THREE.DataTexture | null = null;
let cachedMoonFallbackTex: THREE.CanvasTexture | null = null;

/**
 * Tileable 256×256 RGBA value-noise texture sampled at rotated, incommensurate
 * world-space frequencies so lunar & Martian soils have zero visible tiling,
 * zero dot grids, and zero repeating stripes out to the horizon.
 */
export function getWorldFbmNoiseTexture(): THREE.DataTexture {
  if (cachedNoiseTex) return cachedNoiseTex;

  const size = 256;
  const data = new Uint8Array(size * size * 4);
  let seed = 987654321;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed & 0xff;
  };

  for (let i = 0; i < size * size * 4; i++) {
    data[i] = rand();
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  cachedNoiseTex = tex;
  return tex;
}

/** Tiny neutral white texture to ensure USE_UV/MAP paths stay lightweight if ever needed. */
export function getNeutralRegolithMap(): THREE.CanvasTexture {
  if (cachedMoonFallbackTex) return cachedMoonFallbackTex;
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 4;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 4, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedMoonFallbackTex = tex;
  return tex;
}

/**
 * Warps a flat grid non-uniformly so near-field terrain (0..16 m) has ~0.24 m vertex
 * precision for real lunar craters while using smooth central-difference normals to
 * eliminate quad-diagonal Mach bands on sunlit distant massifs.
 */
export function createNearFieldHorizonGeometry(
  size: number,
  segs: number,
  heightFn: (x: number, z: number) => number,
): THREE.BufferGeometry {
  const half = size * 0.5;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const norm = geo.attributes.normal as THREE.BufferAttribute;
  const eps = 0.28;

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i) / half;
    const uz = pos.getZ(i) / half;
    const wx = Math.sign(ux) * (0.28 * Math.abs(ux) + 0.72 * Math.pow(Math.abs(ux), 1.75)) * half;
    const wz = Math.sign(uz) * (0.28 * Math.abs(uz) + 0.72 * Math.pow(Math.abs(uz), 1.75)) * half;
    const wy = heightFn(wx, wz);
    pos.setXYZ(i, wx, wy, wz);

    // Analytic central-difference normal prevents diagonal "/" triangle facet striping on slopes
    const dhdx = (heightFn(wx + eps, wz) - heightFn(wx - eps, wz)) / (2 * eps);
    const dhdz = (heightFn(wx, wz + eps) - heightFn(wx, wz - eps)) / (2 * eps);
    const invLen = 1 / Math.hypot(dhdx, 1, dhdz);
    norm.setXYZ(i, -dhdx * invLen, invLen, -dhdz * invLen);
  }

  pos.needsUpdate = true;
  norm.needsUpdate = true;
  return geo;
}

export type TerrainShaderOptions = {
  planet: "moon" | "mars";
  anchorXZ: [number, number];
  /** Override base dark soil/regolith tint */
  baseTint?: string;
  /** Override brighter soil/regolith tint */
  brightTint?: string;
  /** Elevated sunlit highland/massif albedo on Moon */
  highlandBrightTint?: string;
  /** Horizon atmospheric/darkness fade start radius (m) */
  fadeStart?: number;
  /** Horizon atmospheric/darkness fade end radius (m) */
  fadeEnd?: number;
  /** Quality tier for multi-octave Moon micro-relief cost scaling */
  qualityTier?: "high" | "medium" | "low";
  /** World solar direction for Moon opposition surge */
  moonSunDir?: [number, number, number];
  /** Mars Phoenix arctic polygon cracks */
  arcticPolygons?: boolean;
  /** Opportunity dust storm darker horizon */
  marsStorm?: boolean;
  /** Bright disturbed Troy ferric-sulfate spot for Spirit */
  spiritTroyPatch?: boolean;
  /** Subtle sand ripples accent for Ingenuity */
  sandRipples?: boolean;
};

/**
 * Configures a MeshStandardMaterial `onBeforeCompile` hook providing:
 * - World-space 4-octave FBM color variation matching LROC Moon / HiRISE Mars
 * - Apollo photo-real Moon Worley cauliflower clods, micro-crater pits & opposition surge
 * - Micro-grain world-space normal perturbation for raking sunlight relief
 * - Distance fade into pure space black (Moon Mare floor only) or Mars butterscotch sky
 */
export function applyWorldTerrainShader(
  mat: THREE.MeshStandardMaterial,
  opts: TerrainShaderOptions,
): void {
  const noiseTex = getWorldFbmNoiseTexture();
  const isMoon = opts.planet === "moon";
  const qLevel = opts.qualityTier === "low" ? 0.0 : opts.qualityTier === "medium" ? 1.0 : 2.0;

  const horizonCol = isMoon
    ? new THREE.Color("#000000")
    : opts.marsStorm
      ? new THREE.Color("#7A331C")
      : new THREE.Color("#C98659");

  const baseDark = opts.baseTint
    ? new THREE.Color(opts.baseTint)
    : isMoon
      ? new THREE.Color("#443F38")
      : opts.arcticPolygons
        ? new THREE.Color("#5E3A2B")
        : opts.marsStorm
          ? new THREE.Color("#632E1C")
          : new THREE.Color("#6F351E");

  const baseLight = opts.brightTint
    ? new THREE.Color(opts.brightTint)
    : isMoon
      ? new THREE.Color("#8D867B")
      : opts.arcticPolygons
        ? new THREE.Color("#9B6A4E")
        : opts.marsStorm
          ? new THREE.Color("#964C30")
          : new THREE.Color("#B5623B");

  const highlandBright = new THREE.Color(opts.highlandBrightTint ?? "#DDD6CA");
  const sunVec = new THREE.Vector3(...(opts.moonSunDir ?? [9.4, 2.85, 4.3])).normalize();

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFbmNoise = { value: noiseTex };
    shader.uniforms.uAnchorXZ = { value: new THREE.Vector2(opts.anchorXZ[0], opts.anchorXZ[1]) };
    shader.uniforms.uBaseDark = { value: baseDark };
    shader.uniforms.uBaseLight = { value: baseLight };
    shader.uniforms.uHighlandBright = { value: highlandBright };
    shader.uniforms.uHorizonCol = { value: horizonCol };
    shader.uniforms.uFadeStart = { value: opts.fadeStart ?? (isMoon ? 72.0 : 28.0) };
    shader.uniforms.uFadeEnd = { value: opts.fadeEnd ?? (isMoon ? 87.5 : 68.0) };
    shader.uniforms.uIsMoon = { value: isMoon ? 1.0 : 0.0 };
    shader.uniforms.uQualityLevel = { value: qLevel };
    shader.uniforms.uMoonSunDir = { value: sunVec };
    shader.uniforms.uIsArctic = { value: opts.arcticPolygons ? 1.0 : 0.0 };
    shader.uniforms.uIsTroy = { value: opts.spiritTroyPatch ? 1.0 : 0.0 };
    shader.uniforms.uIsRipples = { value: opts.sandRipples ? 1.0 : 0.0 };

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTerrainWorldPos;\nvarying vec3 vTerrainLocalPos;")
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvTerrainLocalPos = transformed;\nvTerrainWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uFbmNoise;
        uniform vec2 uAnchorXZ;
        uniform vec3 uBaseDark;
        uniform vec3 uBaseLight;
        uniform vec3 uHighlandBright;
        uniform vec3 uHorizonCol;
        uniform float uFadeStart;
        uniform float uFadeEnd;
        uniform float uIsMoon;
        uniform float uQualityLevel;
        uniform vec3 uMoonSunDir;
        uniform float uIsArctic;
        uniform float uIsTroy;
        uniform float uIsRipples;
        varying vec3 vTerrainWorldPos;
        varying vec3 vTerrainLocalPos;

        float terrainHash(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * 0.1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
        }

        vec2 terrainHash2(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.xx + p3.yz) * p3.zy);
        }

        // Smooth C1 isotropic 2D value noise with analytic XZ gradient (zero texture streaking)
        vec3 terrainNoiseD(vec2 x) {
          vec2 i = floor(x);
          vec2 f = fract(x);
          vec2 u = f * f * (3.0 - 2.0 * f);
          vec2 du = 6.0 * f * (1.0 - f);

          float a = terrainHash(i);
          float b = terrainHash(i + vec2(1.0, 0.0));
          float c = terrainHash(i + vec2(0.0, 1.0));
          float d = terrainHash(i + vec2(1.0, 1.0));

          float k0 = a;
          float k1 = b - a;
          float k2 = c - a;
          float k3 = a - b - c + d;

          float val = k0 + k1 * u.x + k2 * u.y + k3 * u.x * u.y;
          vec2 grad = du * (vec2(k1, k2) + k3 * u.yx);
          return vec3(val, grad);
        }

        // Domain-warped organic lumpy regolith clods + irregular sub-decimeter powder crumbs
        vec3 sampleWorleyClod(vec2 p) {
          vec3 warp = terrainNoiseD(p * 0.48);
          vec2 wp = p + warp.yz * 0.24;
          vec2 n = floor(wp);
          vec2 f = fract(wp);
          float md = 4.0;
          vec2 bestVec = vec2(0.0);
          for (int jy = -1; jy <= 1; jy++) {
            for (int jx = -1; jx <= 1; jx++) {
              vec2 g = vec2(float(jx), float(jy));
              vec2 o = terrainHash2(n + g);
              vec2 r = g + (0.12 + 0.76 * o) - f;
              float d = dot(r, r);
              if (d < md) {
                md = d;
                bestVec = r;
              }
            }
          }
          float d1 = sqrt(max(md, 0.0001));
          float dome = smoothstep(0.72, 0.06, d1);
          vec2 dir = bestVec / max(d1, 0.05);
          return vec3(dome, dir * (1.0 - smoothstep(0.0, 0.68, d1)));
        }

        // Sparse, heavy-tailed, soft-eroded micro-crater dimples (breaks bubble-wrap tiling)
        void sampleMicroCraterLayer(vec2 p, float scale, float seedOff, out float bowlAO, out vec2 cGrad) {
          vec3 jNoise = terrainNoiseD(p * 0.37 + seedOff);
          vec2 sp = p * scale + jNoise.yz * 0.28;
          vec2 cell = floor(sp);
          vec2 f = fract(sp);
          bowlAO = 0.0;
          cGrad = vec2(0.0);
          for (int jy = -1; jy <= 1; jy++) {
            for (int jx = -1; jx <= 1; jx++) {
              vec2 nb = vec2(float(jx), float(jy));
              vec2 h = terrainHash2(cell + nb + seedOff);
              float spawn = terrainHash(cell + nb + seedOff * 1.73);
              if (spawn < 0.145) {
                // Heavy-tailed crater radius distribution: mostly tiny pits, rare medium eroded bowls
                float rt = terrainHash(cell + nb + seedOff * 2.91);
                float rad = mix(0.065, 0.42, rt * rt * rt);
                vec2 diff = f - (nb + 0.16 + 0.68 * h);
                float dist = length(diff);
                float u = dist / rad;
                if (u < 1.32) {
                  float bowl = max(0.0, 1.0 - u * u);
                  float rim = exp(-pow((u - 0.98) / 0.34, 2.0)) * 0.06;
                  float dhdu =
                    (u < 1.0 ? 1.55 * u : 0.0) -
                    0.06 * 2.0 * (u - 0.98) / 0.1156 * exp(-pow((u - 0.98) / 0.34, 2.0));
                  vec2 dir = diff / max(dist, 0.01);
                  bowlAO = max(bowlAO, bowl * 0.55 - rim * 0.25);
                  cGrad += dir * (dhdu * (scale / rad)) * 0.042;
                }
              }
            }
          }
        }

        float sampleFbm4(vec2 p, out float detailGrain, out vec2 worldGrad) {
          mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
          float sum = 0.0;
          float amp = 0.48;
          vec2 q = p * 0.19;
          vec2 gAccum = vec2(0.0);
          mat2 m = mat2(1.0, 0.0, 0.0, 1.0);
          float fineVal = 0.5;

          for (int k = 0; k < 4; k++) {
            vec3 n = terrainNoiseD(q);
            sum += amp * n.x;
            gAccum += amp * (m * n.yz);
            if (k >= 2) fineVal = mix(fineVal, n.x, 0.55);
            q = rot * q * 2.07;
            m = transpose(rot) * m * 2.07;
            amp *= 0.52;
          }

          // Extra fine sub-decimeter mineral regolith grit (faded cleanly with range)
          vec3 grit = terrainNoiseD(p * 6.4);
          detailGrain = mix(fineVal, grit.x, 0.45);
          worldGrad = gAccum * 0.19 + grit.yz * 0.42;
          return clamp(sum / 0.90, 0.0, 1.0);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float grain = 0.5;
        vec2 terrainGradXZ = vec2(0.0);
        float fbm = sampleFbm4(vTerrainWorldPos.xz, grain, terrainGradXZ);
        vec3 soil = mix(uBaseDark, uBaseLight, smoothstep(0.22, 0.78, fbm));
        soil *= (0.93 + 0.14 * grain);

        if (uIsMoon > 0.5) {
          // Fine lumpy powdery regolith grain on mare/valley floor vs silky cream-white massifs
          float distFromCenter = length(vTerrainWorldPos.xz - uAnchorXZ);
          float massifSmooth = smoothstep(0.7, 3.0, vTerrainLocalPos.y);
          float farSmoothing = 1.0 - smoothstep(9.0, 30.0, distFromCenter);

          vec3 clodCoarse = sampleWorleyClod(vTerrainWorldPos.xz * 2.15);
          float clodDome = clodCoarse.x;
          vec2 clodGrad = clodCoarse.yz * 0.65;
          float pitAO = 0.0;

          if (uQualityLevel > 0.5) {
            vec3 clodMid = sampleWorleyClod(vTerrainWorldPos.xz * 5.6 + 13.7);
            clodDome = mix(clodDome, clodMid.x, 0.52);
            clodGrad += clodMid.yz * 0.82;

            vec3 clodCrumb = terrainNoiseD(vTerrainWorldPos.xz * 10.5);
            clodGrad += clodCrumb.yz * 0.52;
            grain = mix(grain, clodCrumb.x, 0.35);

            float pitAO1 = 0.0;
            vec2 pitG1 = vec2(0.0);
            sampleMicroCraterLayer(vTerrainWorldPos.xz, 0.72, 17.3, pitAO1, pitG1);
            pitAO = pitAO1;
            clodGrad += pitG1;

            if (uQualityLevel > 1.5) {
              float pitAO2 = 0.0;
              vec2 pitG2 = vec2(0.0);
              sampleMicroCraterLayer(vTerrainWorldPos.xz, 1.85, 53.1, pitAO2, pitG2);
              pitAO = max(pitAO, pitAO2 * 0.75);
              clodGrad += pitG2;

              vec3 powder = terrainNoiseD(vTerrainWorldPos.xz * 22.0);
              clodGrad += powder.yz * 0.32;
              grain = mix(grain, powder.x, 0.42);
            }
          }

          // Combine fine clumpy regolith texture with occasional soft eroded pits
          float floorRelief = (clodDome - 0.5) * 0.24 - pitAO * 0.16;
          soil *= clamp(0.95 + floorRelief * (1.0 - massifSmooth * 0.92), 0.68, 1.15);

          // Attenuate micro-bump cleanly on smooth distant massif slopes
          float bumpScale = (0.32 + 0.68 * farSmoothing) * (1.0 - massifSmooth * 0.94);
          terrainGradXZ = mix(terrainGradXZ * 0.6, clodGrad + terrainGradXZ * 0.35, bumpScale);

          // Elevated rounded massifs shift smoothly to warm-cream lunar anorthosite
          soil = mix(soil, uHighlandBright * (0.94 + 0.08 * grain), massifSmooth * 0.86);

          // Gentle Lommel-Seeliger / Hapke opposition surge (backscatter toward sun without clipping)
          vec3 toCam = normalize(cameraPosition - vTerrainWorldPos);
          float backScatter = pow(max(0.0, dot(toCam, normalize(uMoonSunDir))), 2.2);
          soil *= (1.0 + 0.22 * backScatter);
        }

        if (uIsRipples > 0.5) {
          vec2 rp = vTerrainWorldPos.xz - uAnchorXZ;
          float rip = 0.5 + 0.5 * sin(rp.x * 2.4 + rp.y * 1.15 + fbm * 4.2);
          soil = mix(soil * 0.90, soil * 1.10, rip * 0.48);
        }

        if (uIsArctic > 0.5) {
          // Polygon-patterned thermal contraction troughs across Vastitas Borealis (analytic cell hash)
          vec2 ap = (vTerrainWorldPos.xz - uAnchorXZ) * 0.68;
          vec2 cell = floor(ap);
          vec2 frac = fract(ap);
          float minDist = 10.0;
          for (int jy = -1; jy <= 1; jy++) {
            for (int jx = -1; jx <= 1; jx++) {
              vec2 nb = vec2(float(jx), float(jy));
              vec2 rnd = terrainHash2(cell + nb);
              vec2 diff = nb + (0.2 + 0.6 * rnd) - frac;
              minDist = min(minDist, dot(diff, diff));
            }
          }
          float edge = sqrt(minDist);
          float trough = smoothstep(0.56, 0.44, edge);
          soil = mix(soil, uBaseDark * 0.52, (1.0 - trough) * 0.55);
          float frost = smoothstep(0.68, 0.88, grain) * 0.14;
          soil = mix(soil, vec3(0.76, 0.72, 0.70), frost);
        }

        if (uIsTroy > 0.5) {
          float troyDist = length(vTerrainWorldPos.xz - uAnchorXZ);
          float troyMask = 1.0 - smoothstep(0.35, 1.35, troyDist);
          soil = mix(soil, vec3(0.78, 0.62, 0.36), troyMask * 0.78);
        }

        diffuseColor.rgb *= soil;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor * (0.91 + 0.12 * grain), 0.80, 0.99);`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        // Transform analytic world XZ gradient cleanly into view space; stronger in lunar near field
        float bumpMaxDist = uIsMoon > 0.5 ? 24.0 : 18.0;
        float bumpFade = 1.0 - smoothstep(4.5, bumpMaxDist, length(vTerrainWorldPos.xz - uAnchorXZ));
        float bumpAmp = uIsMoon > 0.5 ? 0.34 * (1.0 - smoothstep(0.65, 2.6, vTerrainLocalPos.y)) : 0.16;
        vec3 bumpWorld = vec3(-terrainGradXZ.x, 0.0, -terrainGradXZ.y) * bumpAmp * bumpFade;
        vec3 bumpView = (viewMatrix * vec4(bumpWorld, 0.0)).xyz;
        normal = normalize(normal + bumpView);`,
      )
      .replace(
        "#include <tonemapping_fragment>",
        `float hDist = length(vTerrainWorldPos.xz - uAnchorXZ);
        float hFade = smoothstep(uFadeStart, uFadeEnd, hDist);
        float hMask = uIsMoon > 0.5 ? (1.0 - smoothstep(0.6, 2.4, vTerrainLocalPos.y)) : 1.0;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uHorizonCol, hFade * 0.98 * hMask);
        #include <tonemapping_fragment>`,
      );
  };
  mat.customProgramCacheKey = () =>
    `world-terrain-${opts.planet}-${opts.qualityTier ?? "high"}-${opts.arcticPolygons ? 1 : 0}-${opts.marsStorm ? 1 : 0}-${opts.spiritTroyPatch ? 1 : 0}-${opts.sandRipples ? 1 : 0}-${opts.baseTint ?? ""}-${opts.brightTint ?? ""}-${opts.highlandBrightTint ?? ""}`;
}

/** Smoothly fractured angular basalt geometry (non-blocky, natural rock planes for InstancedMesh). */
export function createFracturedBasaltGeometry(variant: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(0.45, 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const planes = [
    new THREE.Vector3(0.78, 0.48, 0.25).normalize(),
    new THREE.Vector3(-0.72, 0.52, 0.38).normalize(),
    new THREE.Vector3(0.18, 0.68, -0.68).normalize(),
    new THREE.Vector3(-0.32, 0.82, 0.42).normalize(),
    new THREE.Vector3(0.42, -0.18, 0.84).normalize(),
    new THREE.Vector3(-0.62, -0.14, -0.74).normalize(),
    new THREE.Vector3(0.65, -0.25, -0.55).normalize(),
  ];

  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    // Soft multi-axis micro-chipping before plane cleaves
    const chip =
      1 +
      0.1 * Math.sin(v.x * 7.2 + variant * 1.3) +
      0.08 * Math.cos(v.z * 6.5 - v.y * 5.1);
    v.multiplyScalar(chip);

    for (let k = 0; k < planes.length; k++) {
      const n = planes[k];
      const clip = 0.28 + ((variant * 17 + k * 9) % 11) * 0.012;
      const d = v.dot(n);
      if (d > clip) {
        v.addScaledVector(n, (clip - d) * 0.85);
      }
    }
    if (v.y < -0.1) v.y = -0.1 + (v.y + 0.1) * 0.2;
    pos.setXYZ(i, v.x * 1.14, v.y * 0.78, v.z * 0.96);
  }
  geo.computeVertexNormals();
  return geo;
}

export type CraterAnchor = { x: number; z: number; r: number };

/**
 * Instanced angular basalt rocks & half-buried pebbles scattered across Moon or Mars terrain.
 * On Mars, upward-facing facets pick up rusty dust tint + distant sky horizon fade.
 * On Moon, rocks sit half-buried with neutral warm-cream variation & optional crater-rim bias.
 */
export function InstancedLandscapeRocks({
  planet,
  count,
  seed,
  anchorXZ,
  clearRadius = 2.1,
  maxRadius,
  spreadRadius = 32,
  heightFn,
  getHeight,
  surfaceY = 0.22,
  scaleRange = [0.09, 0.65],
  scalePower = 2.2,
  embedOffset = 0.14,
  moonCraters,
  maxLocalHeight,
  castShadows = true,
  marsStorm = false,
}: {
  planet: "moon" | "mars";
  count: number;
  seed: number;
  anchorXZ: [number, number];
  clearRadius?: number;
  maxRadius?: number;
  spreadRadius?: number;
  heightFn?: (x: number, z: number) => number;
  getHeight?: (x: number, z: number) => number;
  surfaceY?: number;
  scaleRange?: [number, number];
  scalePower?: number;
  /** Vertical placement factor * sy relative to local groundY */
  embedOffset?: number;
  moonCraters?: readonly CraterAnchor[];
  /** Optional local height ceiling (keeps stray Moon rocks/pebbles off distant mountain flanks) */
  maxLocalHeight?: number;
  castShadows?: boolean;
  marsStorm?: boolean;
}) {
  const refA = useRef<THREE.InstancedMesh>(null);
  const refB = useRef<THREE.InstancedMesh>(null);

  const radiusOuter = maxRadius ?? spreadRadius;
  const countA = Math.ceil(count * 0.52);
  const countB = Math.max(0, count - countA);

  const geoA = useMemo(() => createFracturedBasaltGeometry(1 + seed), [seed]);
  const geoB = useMemo(() => createFracturedBasaltGeometry(3 + seed), [seed]);

  const rockMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: planet === "moon" ? "#6C665D" : "#FFFFFF",
      roughness: planet === "moon" ? 0.97 : 0.93,
      metalness: planet === "moon" ? 0.0 : 0.03,
    });
    const horizonCol =
      planet === "moon"
        ? new THREE.Color("#000000")
        : marsStorm
          ? new THREE.Color("#7A331C")
          : new THREE.Color("#C98659");

    m.onBeforeCompile = (shader) => {
      shader.uniforms.uAnchorXZ = { value: new THREE.Vector2(anchorXZ[0], anchorXZ[1]) };
      shader.uniforms.uHorizonCol = { value: horizonCol };
      shader.uniforms.uIsMars = { value: planet === "mars" ? 1.0 : 0.0 };
      shader.uniforms.uFadeStart = { value: planet === "moon" ? 72.0 : 24.0 };
      shader.uniforms.uFadeEnd = { value: planet === "moon" ? 87.0 : 58.0 };

      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vRockNormW;\nvarying vec3 vRockPosW;",
        )
        .replace(
          "#include <worldpos_vertex>",
          `#include <worldpos_vertex>
          mat4 instM = mat4(1.0);
          #ifdef USE_INSTANCING
            instM = instanceMatrix;
          #endif
          vRockNormW = normalize(mat3(modelMatrix * instM) * objectNormal);
          vRockPosW = (modelMatrix * instM * vec4(transformed, 1.0)).xyz;`,
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec2 uAnchorXZ;
          uniform vec3 uHorizonCol;
          uniform float uIsMars;
          uniform float uFadeStart;
          uniform float uFadeEnd;
          varying vec3 vRockNormW;
          varying vec3 vRockPosW;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          if (uIsMars > 0.5) {
            float topDust = smoothstep(0.18, 0.82, vRockNormW.y);
            diffuseColor.rgb = mix(vec3(0.16, 0.09, 0.07), vec3(0.50, 0.24, 0.12), topDust);
          }`,
        )
        .replace(
          "#include <tonemapping_fragment>",
          `float rDist = length(vRockPosW.xz - uAnchorXZ);
          float rFade = smoothstep(uFadeStart, uFadeEnd, rDist);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, uHorizonCol, rFade * 0.96);
          #include <tonemapping_fragment>`,
        );
    };
    m.customProgramCacheKey = () => `inst-rocks-${planet}-${marsStorm ? 1 : 0}`;
    return m;
  }, [planet, anchorXZ, marsStorm]);

  useEffect(() => {
    const sampleH = heightFn ?? getHeight;
    const minS = scaleRange[0];
    const spanS = Math.max(0.02, scaleRange[1] - scaleRange[0]);
    const isMoon = planet === "moon";
    const tint = new THREE.Color();

    const populate = (mesh: THREE.InstancedMesh | null, n: number, subSeed: number) => {
      if (!mesh || n <= 0) return;
      const dummy = new THREE.Object3D();
      let s = (seed * 1973 + subSeed * 4099) >>> 0;
      const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };

      for (let i = 0; i < n; i++) {
        let rx = 0;
        let rz = 0;
        let localH = 0;
        for (let attempt = 0; attempt < 4; attempt++) {
          if (attempt === 0 && moonCraters && moonCraters.length > 0 && rand() < 0.4) {
            const cr = moonCraters[Math.floor(rand() * moonCraters.length)];
            const a = rand() * Math.PI * 2;
            const rimR = cr.r * (0.88 + rand() * 0.58);
            rx = cr.x + Math.cos(a) * rimR;
            rz = cr.z + Math.sin(a) * rimR;
            if (Math.hypot(rx, rz) < clearRadius) {
              const angle = rand() * Math.PI * 2;
              const r = clearRadius + Math.pow(rand(), 0.78) * (radiusOuter - clearRadius);
              rx = Math.cos(angle) * r;
              rz = Math.sin(angle) * r;
            }
          } else {
            const angle = rand() * Math.PI * 2;
            const span = attempt >= 2 ? Math.min(radiusOuter, 14) : radiusOuter;
            const r = clearRadius + Math.pow(rand(), 0.78) * Math.max(1, span - clearRadius);
            rx = Math.cos(angle) * r;
            rz = Math.sin(angle) * r;
          }
          localH = sampleH ? sampleH(rx, rz) : 0;
          if (maxLocalHeight === undefined || localH <= maxLocalHeight) break;
        }

        const groundY = surfaceY + localH;
        const baseScale = minS + Math.pow(rand(), scalePower) * spanS;
        const sx = baseScale * (0.85 + rand() * 0.55);
        const sy = baseScale * (0.45 + rand() * 0.42);
        const sz = baseScale * (0.8 + rand() * 0.55);
        // Sink Moon rocks/pebbles cleanly into sloping regolith so zero edges hover above soil
        const extraSeat = isMoon ? -0.008 : 0;

        dummy.position.set(rx, groundY + sy * embedOffset + extraSeat, rz);
        dummy.rotation.set((rand() - 0.5) * 0.36, rand() * Math.PI * 2, (rand() - 0.5) * 0.36);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        if (isMoon) {
          // Soil-toned basaltic-to-grey clast variation (avoids specular/HDR white sparkles)
          const shade = 0.56 + rand() * 0.34;
          tint.setRGB(shade * 1.03, shade * 0.99, shade * 0.91);
          mesh.setColorAt(i, tint);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (isMoon && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    populate(refA.current, countA, 1);
    populate(refB.current, countB, 2);
  }, [
    planet,
    countA,
    countB,
    seed,
    clearRadius,
    radiusOuter,
    heightFn,
    getHeight,
    surfaceY,
    scaleRange,
    scalePower,
    embedOffset,
    moonCraters,
    maxLocalHeight,
  ]);

  if (count <= 0) return null;

  return (
    <group>
      <instancedMesh
        ref={refA}
        args={[geoA, rockMat, countA]}
        castShadow={castShadows}
        receiveShadow
      />
      {countB > 0 ? (
        <instancedMesh
          ref={refB}
          args={[geoB, rockMat, countB]}
          castShadow={castShadows}
          receiveShadow
        />
      ) : null}
    </group>
  );
}
