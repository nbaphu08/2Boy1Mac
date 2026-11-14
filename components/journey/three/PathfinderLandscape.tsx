"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { usePerfBudget } from "./perfTier";
import { getKaptonBumpMap } from "./rocketTextures";
import { getMarsRoverTrackTexture } from "./MarsModels";
import { createFracturedBasaltGeometry } from "./landscapeMaterials";

const SURFACE_Y = 0.22;

let cachedAresSoilMap: THREE.CanvasTexture | null = null;
let cachedAresSoilBump: THREE.CanvasTexture | null = null;
let cachedSolarPanelMap: THREE.CanvasTexture | null = null;
let cachedAirbagMap: THREE.CanvasTexture | null = null;
let cachedAirbagBump: THREE.CanvasTexture | null = null;

/** Procedural 1024px fine reddish-brown Ares Vallis flood plain soil & micro-gravel (zero dot grid). */
function getAresSoilTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (cachedAresSoilMap && cachedAresSoilBump) {
    return { map: cachedAresSoilMap, bumpMap: cachedAresSoilBump };
  }

  const size = 512;
  const cCanvas = document.createElement("canvas");
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext("2d")!;

  const bCanvas = document.createElement("canvas");
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext("2d")!;

  // Rich iron-oxide dusty soil matching mars_color_4k & PIA00614
  cCtx.fillStyle = "#8C472A";
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Subtle wind-blown silt bands
  for (let y = 0; y < size; y += 3) {
    const wave = Math.sin(y * 0.08) * 0.5 + 0.5;
    cCtx.fillStyle = `rgba(176, 102, 62, ${(0.04 + wave * 0.05).toFixed(3)})`;
    cCtx.fillRect(0, y, size, 2);
  }

  // Organic multi-scale mineral grain & tiny grit pebbles (using pseudo-random LCG so no repeating grid!)
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 16000; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.7 + rand() * 2.1;
    const t = rand();
    if (t < 0.42) {
      cCtx.fillStyle = "rgba(196, 118, 72, 0.24)";
      bCtx.fillStyle = "rgba(182, 182, 182, 0.26)";
    } else if (t < 0.85) {
      cCtx.fillStyle = "rgba(74, 34, 19, 0.26)";
      bCtx.fillStyle = "rgba(68, 68, 68, 0.26)";
    } else {
      // Scattered angular basalt grit flecks
      cCtx.fillStyle = "rgba(44, 24, 18, 0.38)";
      bCtx.fillStyle = "rgba(224, 224, 224, 0.38)";
    }
    cCtx.fillRect(x, y, r, r);
    bCtx.fillRect(x, y, r, r);
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(34, 34);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(34, 34);

  cachedAresSoilMap = map;
  cachedAresSoilBump = bumpMap;
  return { map, bumpMap };
}

/** High-detail dark blue-black GaAs solar array with crisp silver grid lines & busbars (PIA00614). */
function getCrispSolarCellTextures(): THREE.CanvasTexture {
  if (cachedSolarPanelMap) return cachedSolarPanelMap;
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#0B111C";
  ctx.fillRect(0, 0, size, size);

  const cols = 14;
  const rows = 18;
  const cw = size / cols;
  const ch = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cw;
      const y = r * ch;
      ctx.fillStyle = (r + col) % 2 === 0 ? "#0F1828" : "#121D30";
      ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);

      // Thin silver busbar & collection grid across each cell
      ctx.strokeStyle = "rgba(214, 226, 244, 0.72)";
      ctx.lineWidth = 1.25;
      ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, ch - 3);

      ctx.strokeStyle = "rgba(196, 212, 232, 0.36)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x + cw * 0.5, y + 2);
      ctx.lineTo(x + cw * 0.5, y + ch - 2);
      ctx.stroke();
    }
  }

  // Light ochre Martian dust trace along outer perimeter
  const g = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.18, size * 0.5, size * 0.5, size * 0.68);
  g.addColorStop(0, "rgba(182, 102, 58, 0.04)");
  g.addColorStop(1, "rgba(182, 102, 58, 0.24)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cachedSolarPanelMap = tex;
  return tex;
}

/** Matte wrinkled off-white/tan Vectran airbag fabric texture & deep cloth crease bump (PIA00614). */
function getDeflatedAirbagTextures(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  if (cachedAirbagMap && cachedAirbagBump) {
    return { map: cachedAirbagMap, bumpMap: cachedAirbagBump };
  }
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cCtx = c.getContext("2d")!;

  const b = document.createElement("canvas");
  b.width = size;
  b.height = size;
  const bCtx = b.getContext("2d")!;

  cCtx.fillStyle = "#C9BBA4";
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Vectran cross-weave & stitched tendon seams
  for (let i = 0; i < 64; i++) {
    const y = (i / 64) * size;
    cCtx.strokeStyle = i % 8 === 0 ? "rgba(128, 108, 84, 0.45)" : "rgba(228, 220, 206, 0.22)";
    cCtx.lineWidth = i % 8 === 0 ? 2.6 : 1;
    cCtx.beginPath();
    cCtx.moveTo(0, y);
    cCtx.lineTo(size, y);
    cCtx.stroke();

    bCtx.strokeStyle = i % 8 === 0 ? "rgba(28, 28, 28, 0.72)" : "rgba(170, 170, 170, 0.24)";
    bCtx.lineWidth = i % 8 === 0 ? 3.2 : 1;
    bCtx.beginPath();
    bCtx.moveTo(0, y);
    bCtx.lineTo(size, y);
    bCtx.stroke();
  }

  // Deep diagonal cloth pinch creases & reddish soil staining where airbags dragged on Ares Vallis
  let s = 4242;
  const r = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let k = 0; k < 55; k++) {
    const x0 = r() * size;
    const y0 = r() * size;
    const x1 = x0 + (r() - 0.5) * 190;
    const y1 = y0 + (r() - 0.5) * 110;
    bCtx.strokeStyle = k % 2 === 0 ? "rgba(24, 24, 24, 0.58)" : "rgba(235, 235, 235, 0.5)";
    bCtx.lineWidth = 2 + r() * 5;
    bCtx.beginPath();
    bCtx.moveTo(x0, y0);
    bCtx.quadraticCurveTo((x0 + x1) * 0.5 + (r() - 0.5) * 30, (y0 + y1) * 0.5 + (r() - 0.5) * 30, x1, y1);
    bCtx.stroke();

    if (k % 3 === 0) {
      cCtx.fillStyle = "rgba(154, 86, 52, 0.16)";
      cCtx.beginPath();
      cCtx.arc(x0, y0, 20 + r() * 48, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(b);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  cachedAirbagMap = map;
  cachedAirbagBump = bumpMap;
  return { map, bumpMap };
}

/**
 * Crumpled, low deflated Vectran fabric lobe (flattened bottom, pinched accordion cloth wrinkles).
 * Replaces spherical blobs cleanly.
 */
function createDeflatedClothGeometry(seed: number, length: number, width: number, height: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 24, 16);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    const ang = Math.atan2(z, x);
    // Longitudinal tendon seam grooves (matching Pathfinder's 4-lobe Vectran bags deflated in PIA00614)
    const pinch =
      Math.pow(Math.abs(Math.sin(ang * 3.0 + seed * 1.4)), 1.6) * 0.24 +
      Math.sin(x * 7.5 + z * 5.2 + seed) * 0.08;
    const crumple = Math.sin(z * 11.0 + x * 4.2 + seed * 2.1) * 0.07;

    if (y < 0) {
      // Flattened bottom resting firmly on Martian soil
      y *= 0.14;
    } else {
      // Deflated cloth sag with sharp folded ridges instead of balloon curvature
      y = Math.pow(y, 1.35) * (1.0 - pinch * 0.85 + crumple);
    }

    x *= length * (1.0 + crumple * 0.35);
    z *= width * (1.0 - pinch * 0.22);
    y = Math.max(-0.02, y * height);

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Continuous Ares Vallis flood plain + distant Twin Peaks hills on the -Z horizon (PIA00632). */
function createAresVallisLandscapeGeometry(): THREE.BufferGeometry {
  const size = 148;
  const segs = 136;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  const hill = (vx: number, vz: number, cx: number, cz: number, rx: number, rz: number, h: number) => {
    const dx = (vx - cx) / rx;
    const dz = (vz - cz) / rz;
    const d2 = dx * dx + dz * dz;
    if (d2 > 4.5) return 0;
    const base = Math.exp(-d2 * 0.95);
    const facet = 0.86 + 0.14 * Math.cos(vx * 0.45 + vz * 0.35);
    return h * Math.pow(base, 0.85) * facet;
  };

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const r = Math.hypot(vx, vz);

    // Flat landing plain near the lander/rover (r < 4 m), then natural Ares Vallis flood swales & ridges
    const mask = Math.min(1, Math.max(0, (r - 2.6) / 6.5));
    const swale =
      mask *
      (Math.sin(vx * 0.14 + vz * 0.09) * 0.22 +
        Math.cos(vx * 0.08 - vz * 0.17) * 0.18 +
        Math.sin(vx * 0.55 + vz * 0.45) * 0.045);

    // Distant Twin Peaks on the horizon aligned behind Pathfinder along the -X/-Z sightline (PIA00632)
    const northPeak = hill(vx, vz, -18.5, -38.5, 9.5, 6.2, 3.65);
    const southPeak = hill(vx, vz, -5.2, -41.5, 7.8, 5.8, 2.85);
    // Low distant crater-rim ridges wrapping far perimeter so skyline feels genuinely natural
    const farPerimeter =
      r > 28
        ? Math.min(1, (r - 28) / 22) *
          (0.45 + 0.4 * Math.sin(vx * 0.07 + 1.1) + 0.32 * Math.cos(vz * 0.08 - 0.5))
        : 0;

    pos.setY(i, swale + northPeak + southPeak + farPerimeter);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * AG-10 Part 2 · Rebuilt Mars Pathfinder Lander + Sojourner + Continuous Ares Vallis Plain (Pilot for AG-9b).
 * - No plinth, no spotlight cone; flood plain extends seamlessly to butterscotch horizon + Twin Peaks.
 * - Lander opened flat (2.75 m across) with dark blue-black GaAs solar cells & silver grid lines,
 *   crumpled matte deflated Vectran airbags pulled low against/underneath the petals,
 *   1.5 m IMP stereo mast, ASI/MET weather mast with windsocks, and unrolled ramps.
 * - Sojourner (65 × 48 × 30 cm, rocker-bogie + cleated wheels + APXS touching Yogi boulder).
 */
export function PathfinderLandscape({ reducedMotion: _reducedMotion }: { reducedMotion: boolean }) {
  void _reducedMotion;
  const budget = usePerfBudget();

  const { map: soilMap, bumpMap: soilBump } = useMemo(() => getAresSoilTextures(), []);
  const solarTex = useMemo(() => getCrispSolarCellTextures(), []);
  const { map: airbagMap, bumpMap: airbagBump } = useMemo(() => getDeflatedAirbagTextures(), []);
  const kaptonBump = useMemo(() => getKaptonBumpMap(), []);
  const trackTex = useMemo(() => getMarsRoverTrackTexture(), []);

  const terrainGeo = useMemo(() => createAresVallisLandscapeGeometry(), []);
  const rockGeoA = useMemo(() => createFracturedBasaltGeometry(1), []);
  const rockGeoB = useMemo(() => createFracturedBasaltGeometry(2), []);

  // Open triangular petal geometry (1.02 m long × 1.18 m wide base -> ~2.75 m total opened span)
  const petalGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.58, 0);
    s.lineTo(0.58, 0);
    s.lineTo(0, 1.02);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.032,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Low, flat deflated Vectran cloth airbag geometries (tucked against/under petal edges)
  const airbagGeos = useMemo(
    () => [
      createDeflatedClothGeometry(1, 0.56, 0.28, 0.19),
      createDeflatedClothGeometry(2, 0.48, 0.24, 0.16),
      createDeflatedClothGeometry(3, 0.54, 0.26, 0.18),
    ],
    [],
  );

  // Faceted "Yogi" flood boulder (matching Sonnet AG-2c placement/scale at [1.78, SURFACE_Y, 1.2])
  const yogiRockGeo = useMemo(() => {
    const g = createFracturedBasaltGeometry(4);
    g.scale(1.65, 1.38, 1.45);
    return g;
  }, []);

  // Instanced angular basalt cobbles & boulders across Ares Vallis (dusty upper surfaces)
  const rockInstancesRefA = useRef<THREE.InstancedMesh>(null);
  const rockInstancesRefB = useRef<THREE.InstancedMesh>(null);
  const rockCountA = budget.tier === "high" ? 210 : budget.tier === "medium" ? 130 : 60;
  const rockCountB = budget.tier === "high" ? 190 : budget.tier === "medium" ? 110 : 50;

  useEffect(() => {
    const populate = (mesh: THREE.InstancedMesh | null, count: number, seedOffset: number) => {
      if (!mesh) return;
      const dummy = new THREE.Object3D();
      let s = 9001 + seedOffset * 77;
      const rand = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };

      for (let i = 0; i < count; i++) {
        // Keep central landing & Sojourner pad clear (r > 2.2 m)
        let rx = 0;
        let rz = 0;
        for (let attempt = 0; attempt < 8; attempt++) {
          const a = rand() * Math.PI * 2;
          const r = Math.pow(rand(), 0.72) * 34 + 1.9;
          rx = Math.cos(a) * r;
          rz = Math.sin(a) * r;
          const nearLander = Math.hypot(rx + 0.55, rz + 0.25) < 2.35;
          const nearRover = Math.hypot(rx - 0.9, rz - 0.95) < 1.35;
          if (!nearLander && !nearRover) break;
        }

        const scaleBase = 0.12 + Math.pow(rand(), 2.1) * 0.78;
        const scaleY = scaleBase * (0.48 + rand() * 0.42);
        const scaleX = scaleBase * (0.85 + rand() * 0.55);
        const scaleZ = scaleBase * (0.8 + rand() * 0.55);

        dummy.position.set(rx, SURFACE_Y + scaleY * 0.16, rz);
        dummy.rotation.set((rand() - 0.5) * 0.35, rand() * Math.PI * 2, (rand() - 0.5) * 0.35);
        dummy.scale.set(scaleX, scaleY, scaleZ);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    populate(rockInstancesRefA.current, rockCountA, 1);
    populate(rockInstancesRefB.current, rockCountB, 2);
  }, [rockCountA, rockCountB]);

  // Custom soil material fading horizon smoothly into Martian butterscotch sky (#C98659 in Linear prior to ACES)
  const applyHorizonFade = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWorldPos;",
      )
      .replace(
        "#include <tonemapping_fragment>",
        `
        float horizonDist = length(vWorldPos.xz - vec2(-8.35, -371.0));
        float haze = smoothstep(24.0, 68.0, horizonDist);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.584, 0.238, 0.0998), haze * 0.98);
        #include <tonemapping_fragment>
        `,
      );
  };

  // Custom rock shader putting bright rusty ochre dust onto upward-facing rock surfaces
  const applyRockDustShader = (shader: THREE.WebGLProgramParametersWithUniforms) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRockWorldNorm;\nvarying vec3 vRockWorldPos;",
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        mat4 instMat = mat4(1.0);
        #ifdef USE_INSTANCING
          instMat = instanceMatrix;
        #endif
        vRockWorldNorm = normalize(mat3(modelMatrix * instMat) * objectNormal);
        vRockWorldPos = (modelMatrix * instMat * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vRockWorldNorm;\nvarying vec3 vRockWorldPos;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float topDust = smoothstep(0.18, 0.82, vRockWorldNorm.y);
        diffuseColor.rgb = mix(vec3(0.18, 0.11, 0.08), vec3(0.52, 0.25, 0.13), topDust);`,
      )
      .replace(
        "#include <tonemapping_fragment>",
        `float rockDist = length(vRockWorldPos.xz - vec2(-8.35, -371.0));
        float rockHaze = smoothstep(22.0, 58.0, rockDist);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.584, 0.238, 0.0998), rockHaze * 0.96);
        #include <tonemapping_fragment>`,
      );
  };

  return (
    <group>
      {/* ─── CONTINUOUS ARES VALLIS FLOOD PLAIN TO HORIZON + TWIN PEAKS ─── */}
      <mesh
        name="diorama-terrain"
        geometry={terrainGeo}
        position={[0, SURFACE_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={soilMap}
          bumpMap={soilBump}
          bumpScale={0.055}
          roughness={0.95}
          metalness={0.03}
          onBeforeCompile={applyHorizonFade}
          customProgramCacheKey={() => "ares-vallis-terrain-v2"}
        />
      </mesh>

      {/* Dense Instanced Angular Flood Rocks with Dusty Top Faces */}
      <instancedMesh ref={rockInstancesRefA} args={[rockGeoA, undefined, rockCountA]} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.93}
          metalness={0.04}
          onBeforeCompile={applyRockDustShader}
          customProgramCacheKey={() => "ares-rock-dust-v2"}
        />
      </instancedMesh>
      <instancedMesh ref={rockInstancesRefB} args={[rockGeoB, undefined, rockCountB]} castShadow receiveShadow>
        <meshStandardMaterial
          roughness={0.94}
          metalness={0.04}
          onBeforeCompile={applyRockDustShader}
          customProgramCacheKey={() => "ares-rock-dust-v2"}
        />
      </instancedMesh>

      {/* ─── MARS PATHFINDER OPENED TETRAHEDRAL LANDER (~2.75 m across) ─── */}
      <group position={[-0.55, SURFACE_Y, -0.25]} rotation={[0, 0.24, 0]}>
        {/* Central Triangular Base Deck */}
        <mesh position={[0, 0.055, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.58, 0.62, 0.08, 3]} />
          <meshStandardMaterial color="#B8883C" bumpMap={kaptonBump} bumpScale={0.015} roughness={0.46} metalness={0.68} />
        </mesh>

        {/* Central Base Top Dark GaAs Solar / Deck Hardware */}
        <mesh position={[0, 0.098, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <circleGeometry args={[0.5, 3]} />
          <meshStandardMaterial map={solarTex} roughness={0.28} metalness={0.62} />
        </mesh>

        {/* 3 Opened Triangular Petals Lying Flat on the Ground (~2.75 m total spread) */}
        {[0, 1, 2].map((pi) => {
          const angle = (pi * Math.PI * 2) / 3;
          return (
            <group key={pi} rotation={[0, angle, 0]}>
              <group position={[0, 0.042, 0.34]} rotation={[0.035, 0, 0]}>
                {/* Anodized aluminum / bronze petal structural frame */}
                <mesh geometry={petalGeo} castShadow receiveShadow>
                  <meshStandardMaterial color="#9E7B46" roughness={0.48} metalness={0.66} />
                </mesh>

                {/* Glossy Dark Blue-Black Solar Cell Array with Silver Grid Lines on Petal Top */}
                <mesh position={[0, 0.041, 0.45]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                  <planeGeometry args={[0.66, 0.62]} />
                  <meshStandardMaterial map={solarTex} roughness={0.24} metalness={0.66} />
                </mesh>

                {/* Twin Hinge Actuator Brackets */}
                {[-0.25, 0.25].map((hx, hi) => (
                  <mesh key={hi} position={[hx, 0.045, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.024, 0.024, 0.14, 10]} />
                    <meshStandardMaterial color="#C8CFD8" roughness={0.34} metalness={0.82} />
                  </mesh>
                ))}
              </group>

              {/* Deflated Crumpled Vectran Fabric Airbags pulled low & tucked against/under outer petal edges (PIA00614) */}
              {pi !== 0 ? (
                <group position={[0.15, 0.025, 1.05]} rotation={[0, pi * 0.4, 0]}>
                  <mesh
                    geometry={airbagGeos[pi % airbagGeos.length]}
                    position={[0, 0.015, 0]}
                    rotation={[0.06, 0.25, -0.04]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      map={airbagMap}
                      bumpMap={airbagBump}
                      bumpScale={0.045}
                      roughness={0.94}
                      metalness={0.02}
                    />
                  </mesh>
                  <mesh
                    geometry={airbagGeos[(pi + 1) % airbagGeos.length]}
                    position={[-0.38, 0.012, -0.14]}
                    rotation={[-0.04, -0.55, 0.05]}
                    scale={[0.82, 0.78, 0.86]}
                    castShadow
                    receiveShadow
                  >
                    <meshStandardMaterial
                      map={airbagMap}
                      bumpMap={airbagBump}
                      bumpScale={0.045}
                      roughness={0.94}
                      metalness={0.02}
                    />
                  </mesh>
                </group>
              ) : null}
            </group>
          );
        })}

        {/* Central Gold Kapton Thermal Electronics Enclosure */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.34, 0.24, 6]} />
          <meshStandardMaterial
            color="#C98D32"
            bumpMap={kaptonBump}
            bumpScale={0.024}
            roughness={0.38}
            metalness={0.8}
          />
        </mesh>

        {/* Imager for Mars Pathfinder (IMP) Stereo Camera on ~1.5 m Vertical Mast */}
        <group position={[0.06, 0.32, -0.08]}>
          {/* Anodized Aluminum Mast Tube (extends up to ~1.5 m above soil) */}
          <mesh position={[0, 0.56, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.032, 1.12, 12]} />
            <meshStandardMaterial color="#B8C1CE" roughness={0.35} metalness={0.84} />
          </mesh>
          {/* Gold Kapton gimbal neck */}
          <mesh position={[0, 1.13, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.036, 0.09, 10]} />
            <meshStandardMaterial color="#C98D32" bumpMap={kaptonBump} bumpScale={0.02} roughness={0.4} metalness={0.78} />
          </mesh>
          {/* IMP Stereo Camera Head (facing toward foreground/Yogi) */}
          <group position={[0, 1.2, 0]} rotation={[0.12, 0.38, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.2, 0.1, 0.12]} />
              <meshStandardMaterial color="#D4CEC4" roughness={0.42} metalness={0.55} />
            </mesh>
            {[-0.06, 0.06].map((lx, li) => (
              <mesh key={li} position={[lx, 0, 0.068]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.022, 0.024, 0.03, 12]} />
                <meshStandardMaterial color="#18202C" roughness={0.22} metalness={0.88} />
              </mesh>
            ))}
          </group>
        </group>

        {/* ASI/MET Meteorology Weather Mast with 3 Tiny Windsocks mounted on side petal */}
        <group position={[-0.64, 0.08, -0.34]}>
          <mesh position={[0, 0.48, 0]} castShadow>
            <cylinderGeometry args={[0.011, 0.016, 0.96, 8]} />
            <meshStandardMaterial color="#C8D0DC" roughness={0.35} metalness={0.82} />
          </mesh>
          {[0.38, 0.64, 0.88].map((wy, wi) => (
            <group key={wi} position={[0, wy, 0]}>
              <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.005, 0.005, 0.1, 6]} />
                <meshStandardMaterial color="#AEB8C6" roughness={0.4} metalness={0.78} />
              </mesh>
              {/* Tiny tapered windsock fluttering gently */}
              <mesh position={[0.12, -0.01, 0.01]} rotation={[0.15, 0.2, 1.38]} castShadow>
                <coneGeometry args={[0.018, 0.07, 10, 1, true]} />
                <meshStandardMaterial color="#D6CEC2" roughness={0.85} metalness={0.1} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Steerable High-Gain Dish + Low-Gain Antenna Whip */}
        <group position={[-0.18, 0.38, 0.14]} rotation={[0.42, -0.35, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.15, 0.13, 0.035, 18]} />
            <meshStandardMaterial color="#DDD7CB" roughness={0.44} metalness={0.42} />
          </mesh>
        </group>
        <mesh position={[0.2, 0.56, -0.18]} castShadow>
          <cylinderGeometry args={[0.01, 0.014, 0.48, 8]} />
          <meshStandardMaterial color="#C8CFD8" roughness={0.35} metalness={0.78} />
        </mesh>

        {/* Two Thin Unrolled Flexible Metal Rover Deployment Ramps (PIA00614 lower-right) */}
        {[-0.18, 0.24].map((rxOff, ri) => (
          <group
            key={ri}
            position={[0.42 + rxOff * 0.45, 0.045, 0.92 - rxOff * 0.32]}
            rotation={[0.075, 0.42 + ri * 0.12, 0]}
          >
            <mesh position={[0, 0, 0.36]} castShadow receiveShadow>
              <boxGeometry args={[0.19, 0.008, 0.78]} />
              <meshStandardMaterial color="#AEB6C2" roughness={0.36} metalness={0.78} />
            </mesh>
            {/* Corrugated ramp grip slats */}
            {[-0.24, -0.1, 0.04, 0.18, 0.32, 0.46, 0.6].map((rz, rzi) => (
              <mesh key={rzi} position={[0, 0.006, rz + 0.18]}>
                <boxGeometry args={[0.18, 0.006, 0.018]} />
                <meshStandardMaterial color="#8A7658" roughness={0.5} metalness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ─── ROVER WHEEL TRACKS CURVING FROM LANDER RAMP TO YOGI BOULDER ─── */}
      <mesh position={[0.52, SURFACE_Y + 0.025, 0.72]} rotation={[-Math.PI / 2, 0, -0.58]}>
        <planeGeometry args={[1.65, 0.5]} />
        <meshBasicMaterial map={trackTex} transparent opacity={0.84} depthWrite={false} />
      </mesh>

      {/* ─── "YOGI" BOULDER (preserving Sonnet AG-2c scale/position right beside Sojourner) ─── */}
      <group position={[1.78, SURFACE_Y + 0.12, 1.2]} rotation={[0.06, 0.55, -0.05]} scale={0.5}>
        <mesh geometry={yogiRockGeo} castShadow receiveShadow>
          <meshStandardMaterial
            roughness={0.95}
            metalness={0.04}
            onBeforeCompile={applyRockDustShader}
            customProgramCacheKey={() => "ares-rock-dust-v1"}
          />
        </mesh>
      </group>

      {/* ─── SOJOURNER MICROROVER (65 × 48 × 30 cm real proportions, touching Yogi with APXS) ─── */}
      <group position={[1.06, SURFACE_Y + 0.01, 0.99]} rotation={[0, 0.96, 0]} scale={1.12}>
        {/* Gold Kapton Warm Electronics Box (WEB) body */}
        <mesh position={[0, 0.165, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.115, 0.52]} />
          <meshStandardMaterial
            color="#C98D32"
            bumpMap={kaptonBump}
            bumpScale={0.024}
            roughness={0.36}
            metalness={0.82}
          />
        </mesh>

        {/* Glossy Dark GaAs Top Solar Panel with Silver Grid Lines */}
        <mesh position={[0, 0.228, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.014, 0.58]} />
          <meshStandardMaterial map={solarTex} roughness={0.22} metalness={0.66} />
        </mesh>

        {/* Aluminum Top Perimeter Frame & Front Hazard Stereo Cameras */}
        <mesh position={[0, 0.175, 0.275]} castShadow>
          <boxGeometry args={[0.32, 0.04, 0.025]} />
          <meshStandardMaterial color="#C8CFD8" roughness={0.34} metalness={0.82} />
        </mesh>

        {/* 6 Cleated Aluminum Wheels on Rocker-Bogie Suspension */}
        {[-0.225, 0.225].map((wx, si) => (
          <group key={si} position={[wx, 0.075, 0]}>
            {/* Upper rocker-bogie aluminum tube frame */}
            <mesh position={[si === 0 ? 0.035 : -0.035, 0.065, -0.06]} rotation={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.018, 0.02, 0.34]} />
              <meshStandardMaterial color="#CBD2DC" roughness={0.32} metalness={0.84} />
            </mesh>
            <mesh position={[si === 0 ? 0.035 : -0.035, 0.045, 0.1]} rotation={[-0.2, 0, 0]} castShadow>
              <boxGeometry args={[0.018, 0.02, 0.28]} />
              <meshStandardMaterial color="#CBD2DC" roughness={0.32} metalness={0.84} />
            </mesh>
            {[-0.21, 0, 0.21].map((wz, wi) => (
              <group key={wi} position={[0, 0, wz]}>
                {/* Dark cleated tire cylinder */}
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[0.075, 0.075, 0.062, 16]} />
                  <meshStandardMaterial color="#252932" roughness={0.55} metalness={0.68} />
                </mesh>
                {/* Brushed aluminum wheel hub & rim flange */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.068, 12]} />
                  <meshStandardMaterial color="#D4DBE6" roughness={0.32} metalness={0.84} />
                </mesh>
                {/* Tiny radial tread cleats visible at close range */}
                {[0, 1, 2, 3].map((ci) => (
                  <mesh key={ci} rotation={[(ci * Math.PI) / 4, 0, 0]}>
                    <boxGeometry args={[0.064, 0.156, 0.008]} />
                    <meshStandardMaterial color="#9CA4B2" roughness={0.45} metalness={0.75} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}

        {/* Front APXS Deployment Arm & Copper Sensor Head touching Yogi Boulder */}
        <mesh position={[0, 0.145, 0.32]} rotation={[0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.028, 0.034, 0.16, 12]} />
          <meshStandardMaterial color="#D4DBE6" roughness={0.35} metalness={0.82} />
        </mesh>
        <mesh position={[0, 0.175, 0.39]} rotation={[0.42, 0, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.045, 12]} />
          <meshStandardMaterial color="#B8723B" roughness={0.35} metalness={0.78} />
        </mesh>

        {/* Rear UHF Whip Antenna */}
        <mesh position={[-0.14, 0.36, -0.22]}>
          <cylinderGeometry args={[0.005, 0.007, 0.28, 6]} />
          <meshStandardMaterial color="#DCE2EC" roughness={0.35} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
