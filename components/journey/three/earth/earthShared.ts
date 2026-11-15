import * as THREE from "three";

/**
 * Opus pad scene · shared world constants for the LC-39B dusk landscape (beats 0–3).
 * Composition reference: launch seen across calm water, dark tree line, VAB small on the horizon.
 * Palette follows "Deep Field": cool slate/grey-blue, warmth only as a faint hint toward the sun.
 */

/** Surface heights (world units, pad deck ≈ 0). */
export const WATER_Y = -1.72;
export const LAND_Y = -1.56;

/** Low dusk sun (~4° above WNW horizon, 6:35 p.m. EDT) — must match the sky dome. */
export const SUN_DIR = new THREE.Vector3(-0.82, 0.072, -0.57).normalize();

/** Horizon haze colours shared by sky, water, land, trees and the post haze (linear via THREE.Color). */
export const HAZE_COOL = new THREE.Color("#A3A9B6");
export const HAZE_WARM = new THREE.Color("#C2B0A7");
export const HAZE_HIGH = new THREE.Color("#717B92");

/** Distant VAB (true distance ≈ 5 km ⇒ ~600 world units, 1 unit ≈ 8.5 m). */
export const VAB_POS: [number, number, number] = [-205, LAND_Y, -575];
export const VAB_SCALE = 1.55;

/** Analytic lagoon shoreline south of the pad (z grows toward the camera). Mirrors GLSL `shoreZ`. */
export function shoreZ(x: number): number {
  return 30 + 4.0 * Math.sin(x * 0.043 + 0.7) + 2.2 * Math.sin(x * 0.13 + 2.1) + 1.2 * Math.sin(x * 0.31);
}

/** Atlantic beach line distance (ocean beyond ≈ 62). */
export function coastDist(x: number, z: number): number {
  return x * 0.867 - z * 0.497;
}

/** Inland pond field (wetland ponds where > 1.05). Mirrors GLSL `pondField`. */
export function pondField(x: number, z: number): number {
  return (
    Math.sin(x * 0.021 + 1.0) * Math.sin(z * 0.017 - 0.4) +
    0.5 * Math.sin(x * 0.047 - z * 0.033 + 2.0) +
    0.35 * Math.sin(x * 0.09 + z * 0.07)
  );
}

/** Distance from point to the crawlerway centre line (pad → VAB). */
export function crawlerwayDist(x: number, z: number): { lat: number; along: number; len: number } {
  const dx = VAB_POS[0];
  const dz = VAB_POS[2];
  const len = Math.hypot(dx, dz);
  const ux = dx / len;
  const uz = dz / len;
  const along = x * ux + z * uz;
  const lat = Math.abs(x * -uz + z * ux);
  return { lat, along, len };
}

/** True when (x, z) is open water (lagoon, ocean or pond). */
export function isWater(x: number, z: number): boolean {
  if (coastDist(x, z) > 60) return true;
  if (z > shoreZ(x) && coastDist(x, z) < 60) return true;
  const r = Math.hypot(x, z);
  if (r > 60 && pondField(x, z) > 1.05) {
    const cw = crawlerwayDist(x, z);
    if (cw.lat < 22 && cw.along > 0 && cw.along < cw.len + 40) return false;
    return true;
  }
  return false;
}

/** GLSL helpers (value noise, fbm, land/water mask, aerial-perspective haze). */
export const EARTH_GLSL = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uHazeCool;
  uniform vec3 uHazeWarm;
  uniform vec3 uHazeHigh;
  uniform vec2 uVabXZ;

  float eHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float eNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = eHash(i);
    float b = eHash(i + vec2(1.0, 0.0));
    float c = eHash(i + vec2(0.0, 1.0));
    float d = eHash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float eFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * eNoise(p);
      p = r * p * 2.03 + vec2(17.1, 9.3);
      a *= 0.5;
    }
    return v;
  }

  float shoreZ(float x) {
    return 30.0 + 4.0 * sin(x * 0.043 + 0.7) + 2.2 * sin(x * 0.13 + 2.1) + 1.2 * sin(x * 0.31);
  }
  float coastDistF(vec2 p) { return p.x * 0.867 - p.y * 0.497; }
  float pondField(vec2 p) {
    return sin(p.x * 0.021 + 1.0) * sin(p.y * 0.017 - 0.4)
      + 0.5 * sin(p.x * 0.047 - p.y * 0.033 + 2.0)
      + 0.35 * sin(p.x * 0.09 + p.y * 0.07);
  }
  // Signed land distance-ish value: > 0 land, < 0 water (world units, approx).
  float landSdf(vec2 p) {
    float lagoon = shoreZ(p.x) - p.y;
    float ocean = 60.0 - coastDistF(p);
    float land = min(lagoon, ocean);
    float r = length(p);
    vec2 u = normalize(uVabXZ);
    float along = dot(p, u);
    float lat = abs(dot(p, vec2(-u.y, u.x)));
    float crawl = (along > 0.0 && along < length(uVabXZ) + 40.0) ? smoothstep(22.0, 34.0, lat) : 1.0;
    float pond = (1.05 - pondField(p)) * 18.0;
    pond = mix(40.0, pond, smoothstep(55.0, 75.0, r) * crawl);
    return min(land, pond);
  }

  // Aerial perspective: cool grey-blue haze, faint warmth toward the low sun.
  vec3 hazeColor(vec3 viewDir) {
    float s = pow(max(dot(viewDir, uSunDir), 0.0), 3.0);
    vec3 c = mix(uHazeCool, uHazeWarm, s * 0.75);
    return mix(c, uHazeHigh, smoothstep(0.05, 0.45, viewDir.y));
  }
  float hazeAmount(float dist, float worldY) {
    float h = exp(-max(worldY + 1.6, 0.0) * 0.045);
    return clamp(1.0 - exp(-max(dist - 18.0, 0.0) * 0.0042 * (0.55 + 0.45 * h)), 0.0, 0.97);
  }
`;

export function makeEarthUniforms() {
  return {
    uSunDir: { value: SUN_DIR.clone() },
    uHazeCool: { value: HAZE_COOL.clone() },
    uHazeWarm: { value: HAZE_WARM.clone() },
    uHazeHigh: { value: HAZE_HIGH.clone() },
    uVabXZ: { value: new THREE.Vector2(VAB_POS[0], VAB_POS[2]) },
  };
}
