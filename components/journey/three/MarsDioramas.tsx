"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DIORAMA_SURFACE_Y } from "./MoonDioramas";
import { usePerfBudget } from "./perfTier";
import {
  InSightSurfaceInstruments,
  IngenuityAndBackshellProps,
  PhoenixLanderModel,
  Viking1SiteProps,
  getMarsRoverTrackTexture,
} from "./MarsModels";
import { PathfinderLandscape } from "./PathfinderLandscape";

let cachedMarsColor: THREE.CanvasTexture | null = null;
let cachedMarsBump: THREE.CanvasTexture | null = null;
let cachedArcticColor: THREE.CanvasTexture | null = null;

/** Procedural rusty orange-brown Martian regolith texture + bump map (matching mars_color_4k.jpg tones). */
export function getMarsRegolithTextures(isArctic = false): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (!isArctic && cachedMarsColor && cachedMarsBump) {
    return { map: cachedMarsColor, bumpMap: cachedMarsBump };
  }
  if (isArctic && cachedArcticColor && cachedMarsBump) {
    return { map: cachedArcticColor, bumpMap: cachedMarsBump };
  }

  const size = 512;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  // Rusty iron-oxide base tone
  cCtx.fillStyle = isArctic ? "#985236" : "#A65535";
  cCtx.fillRect(0, 0, size, size);
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Fine eolian wind-ripple streaks
  for (let y = 0; y < size; y += 4) {
    const wave = Math.sin(y * 0.09) * 0.5 + 0.5;
    cCtx.fillStyle = wave > 0.5 ? "rgba(198, 114, 72, 0.14)" : "rgba(74, 32, 18, 0.14)";
    cCtx.fillRect(0, y, size, 2);
    bCtx.fillStyle = wave > 0.5 ? "rgba(185, 185, 185, 0.18)" : "rgba(75, 75, 75, 0.18)";
    bCtx.fillRect(0, y, size, 2);
  }

  // Granular iron-oxide dust & dark basalt grit
  for (let i = 0; i < 8500; i++) {
    const x = (i * 179) % size;
    const y = (i * 313) % size;
    const r = 1 + (i % 3);
    const bright = i % 3 === 0;
    cCtx.fillStyle = bright ? "rgba(214, 134, 88, 0.24)" : "rgba(62, 26, 15, 0.25)";
    cCtx.fillRect(x, y, r, r);
    bCtx.fillStyle = bright ? "rgba(215, 215, 215, 0.25)" : "rgba(48, 48, 48, 0.25)";
    bCtx.fillRect(x, y, r, r);
  }

  if (isArctic) {
    // Polygon-patterned arctic permafrost contraction troughs for Phoenix (SM-M-005)
    cCtx.strokeStyle = "rgba(58, 25, 14, 0.55)";
    cCtx.lineWidth = 4;
    const pts = [
      [64, 64],
      [192, 48],
      [340, 72],
      [460, 56],
      [82, 196],
      [216, 184],
      [352, 208],
      [458, 190],
      [58, 342],
      [198, 328],
      [336, 354],
      [464, 338],
      [92, 462],
      [228, 456],
      [368, 468],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3],
      [4, 5], [5, 6], [6, 7],
      [8, 9], [9, 10], [10, 11],
      [12, 13], [13, 14],
      [0, 4], [1, 5], [2, 6], [3, 7],
      [4, 8], [5, 9], [6, 10], [7, 11],
      [8, 12], [9, 13], [10, 14],
    ];
    for (const [a, b] of edges) {
      cCtx.beginPath();
      cCtx.moveTo(pts[a][0], pts[a][1]);
      cCtx.lineTo(pts[b][0], pts[b][1]);
      cCtx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  if (!cachedMarsBump) {
    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(2, 2);
    cachedMarsBump = bumpMap;
  }

  if (isArctic) {
    cachedArcticColor = map;
  } else {
    cachedMarsColor = map;
  }

  return { map, bumpMap: cachedMarsBump! };
}

/**
 * Generates a displaced circular Martian terrain patch customized per Hall II site (SM-M-001 .. SM-M-007).
 */
function createMarsTerrainGeometry(slug: string): THREE.BufferGeometry {
  const radius = 3.25;
  const segs = 48;
  const plane = new THREE.PlaneGeometry(radius * 2, radius * 2, segs, segs);
  plane.rotateX(-Math.PI / 2);

  const pos = plane.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const nx = vx / radius;
    const nz = vz / radius;
    const cx = nx * Math.sqrt(Math.max(0, 1 - (nz * nz) / 2)) * radius;
    const cz = nz * Math.sqrt(Math.max(0, 1 - (nx * nx) / 2)) * radius;
    const rNorm = Math.min(1, Math.hypot(cx, cz) / radius);
    const edgeTaper = 1 - Math.pow(rNorm, 3.5);

    let h = (Math.sin(cx * 1.8 + cz * 1.4) * 0.03 + Math.cos(cx * 3.1 - cz * 2.2) * 0.018) * edgeTaper;

    if (slug === "mars-viking-1") {
      // Chryse Planitia: rocky plain with low windblown drift dunes in back
      h += Math.sin(cx * 2.4 + cz * 3.2) * 0.035 * edgeTaper;
    } else if (slug === "mars-pathfinder") {
      // Ares Vallis: rocky outwash plain sloping gently toward Twin Peaks
      h += (-cz * 0.03 + Math.sin(cx * 2.8) * 0.025) * edgeTaper;
    } else if (slug === "mars-spirit") {
      // Gusev Crater ("Troy"): soft sand-trap depression in center where Spirit's wheels sank + raised Home Plate edge on back-left
      const sandTrap = -Math.exp(-((cx * cx + cz * cz) / 1.45)) * 0.11;
      const homePlateFoot =
        cx < -0.5 && cz < -0.6
          ? Math.min(0.32, Math.max(0, (-cz - 0.6) * 0.22) * Math.max(0, (-cx - 0.3) * 0.25))
          : 0;
      h += (sandTrap + homePlateFoot) * edgeTaper;
    } else if (slug === "mars-opportunity") {
      // Perseverance Valley at the rim of Endeavour Crater: distinct inclined valley slope
      const craterSlope = (-cz * 0.14 + cx * 0.05) * (1 - Math.pow(rNorm, 5));
      h += craterSlope;
    } else if (slug === "mars-phoenix") {
      // Vastitas Borealis: polygon-patterned arctic ground with shallow polygonal troughs
      const polyTrough =
        -Math.abs(Math.sin(cx * 2.3 + Math.cos(cz * 1.7) * 0.5) * Math.sin(cz * 2.3)) * 0.045;
      h += polyTrough * edgeTaper;
    } else if (slug === "mars-insight") {
      // Elysium Planitia: flat, smooth plain chosen for landing safety
      h *= 0.28;
    } else if (slug === "mars-ingenuity") {
      // "Valinor Hills", Jezero Crater: pronounced windblown sand ripples & dune crests
      const sandRipples = Math.sin(cx * 4.8 + cz * 2.2) * 0.075 + Math.cos(cx * 2.4 - cz * 3.6) * 0.045;
      h += sandRipples * edgeTaper;
    }

    pos.setXYZ(i, cx, Math.max(-0.14, h), cz);
  }

  plane.computeVertexNormals();
  return plane;
}

/**
 * Sculpted Martian mesa / plateau / crater-rim backdrop (Home Plate, Twin Peaks, Endeavour rim, Valinor Hills).
 */
function SculptedMarsLandform({
  position,
  rotation = [0, 0, 0],
  width = 3.2,
  depth = 1.5,
  height = 1.0,
  flatTop = false,
  seed = 1,
  color = "#7D3E26",
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  depth?: number;
  height?: number;
  flatTop?: boolean;
  seed?: number;
  color?: string;
}) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 36, 18);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const nx = vx / (width * 0.5);
      const nz = vz / (depth * 0.5);
      const envX = Math.max(0, 1 - nx * nx);
      const envZ = Math.max(0, 1 - nz * nz);
      let profile = Math.pow(envX, 1.2) * Math.pow(envZ, 1.2);
      if (flatTop) {
        // Layered plateau profile for Home Plate at Spirit's site
        profile = Math.min(0.68, profile * 1.45) / 0.68;
      }
      const ridge =
        0.74 +
        0.18 * Math.cos(nx * 2.8 + seed) +
        0.09 * Math.sin(nx * 6.2 - nz * 3.1 + seed * 1.7);
      pos.setY(i, Math.max(0, profile * ridge * height));
    }
    g.computeVertexNormals();
    return g;
  }, [width, depth, height, flatTop, seed]);

  return (
    <mesh position={position} rotation={rotation} geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.94} metalness={0.04} />
    </mesh>
  );
}

/**
 * Curved Martian butterscotch/tan horizon haze backdrop behind each Hall II diorama.
 * Darker reddish-brown storm mood on Opportunity (SM-M-004).
 */
function MarsButterscotchHazeArc({ isStorm }: { isStorm: boolean }) {
  const uniforms = useMemo(
    () => ({
      uHorizon: { value: new THREE.Color(isStorm ? "#7A331C" : "#C98254") },
      uUpper: { value: new THREE.Color(isStorm ? "#28100A" : "#1C110E") },
      uOpacity: { value: isStorm ? 0.52 : 0.34 },
    }),
    [isStorm],
  );

  return (
    <mesh position={[0, DIORAMA_SURFACE_Y + 1.35, -1.35]} rotation={[0, Math.PI, 0]}>
      <cylinderGeometry args={[3.55, 3.55, 2.9, 36, 1, true, -Math.PI * 0.42, Math.PI * 0.84]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uHorizon;
          uniform vec3 uUpper;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            float edgeFade = sin(vUv.x * 3.14159265);
            float vFade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
            vec3 col = mix(uHorizon, uUpper, clamp(vUv.y * 1.35, 0.0, 1.0));
            gl_FragColor = vec4(col, uOpacity * edgeFade * vFade);
          }
        `}
      />
    </mesh>
  );
}

/**
 * Subtle airborne Martian dust particles (more than the Moon, still light; denser on Opportunity storm beat).
 */
export function MarsDustParticles({
  reducedMotion,
  isStorm = false,
}: {
  reducedMotion: boolean;
  isStorm?: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);
  const budget = usePerfBudget();
  const count = isStorm ? Math.round(budget.dioramaDustCount * 1.4) : budget.dioramaDustCount;

  const basePositions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = 0.2 + ((i * 41) % 100) * 0.028;
      arr[i * 3 + 0] = Math.cos(a) * r;
      arr[i * 3 + 1] = DIORAMA_SURFACE_Y + 0.15 + ((i * 59) % 100) * 0.028;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current || reducedMotion) return;
    elapsedRef.current += Math.min(delta, 0.05);
    const t = elapsedRef.current;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const speed = isStorm ? 0.55 : 0.34;
    for (let i = 0; i < count; i++) {
      const bx = basePositions[i * 3 + 0];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];
      pos.setXYZ(
        i,
        bx + Math.sin(t * speed + i) * 0.14,
        by + Math.cos(t * 0.26 + i * 1.5) * 0.05,
        bz + Math.cos(t * speed * 0.8 + i * 0.9) * 0.09,
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={isStorm ? "#C86438" : "#DF9B6D"}
        size={isStorm ? 0.042 : 0.035}
        transparent
        opacity={isStorm ? 0.62 : 0.48}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Scattered dark Martian vesicular basalt rocks (configurable density per site). */
function ScatteredMarsRocks({ seed, count = 16 }: { seed: number; count?: number }) {
  const rocks = useMemo(() => {
    const items: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number] }[] = [];
    for (let i = 0; i < count; i++) {
      const k = seed * 37 + i * 19;
      const angle = ((k * 67) % 360) * (Math.PI / 180);
      const rad = 1.15 + ((k * 43) % 175) * 0.011;
      const rx = Math.cos(angle) * rad;
      const rz = Math.sin(angle) * rad;
      const s = 0.042 + (i % 5) * 0.024;
      items.push({
        pos: [rx, DIORAMA_SURFACE_Y + s * 0.32, rz],
        scale: [s * 1.3, s * 0.74, s * 1.05],
        rot: [(k % 7) * 0.35, (k % 11) * 0.45, (k % 5) * 0.25],
      });
    }
    return items;
  }, [seed, count]);

  return (
    <group>
      {rocks.map((r, idx) => (
        <mesh key={idx} position={r.pos} scale={r.scale} rotation={r.rot}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={idx % 2 === 0 ? "#483228" : "#5A3E30"}
            roughness={0.94}
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Renders the complete Hall II Martian diorama for SM-M-001 .. SM-M-007 per AG-2, AG-3b & REF_MARS.md.
 */
export function HallTwoMarsDiorama({
  slug,
  reducedMotion,
  children,
}: {
  slug: string;
  reducedMotion: boolean;
  children?: React.ReactNode;
}) {
  const isArctic = slug === "mars-phoenix";
  const isStorm = slug === "mars-opportunity";
  const { map: regolithMap, bumpMap: regolithBump } = useMemo(
    () => getMarsRegolithTextures(isArctic),
    [isArctic],
  );
  const trackTex = useMemo(() => getMarsRoverTrackTexture(), []);
  const terrainGeo = useMemo(() => createMarsTerrainGeometry(slug), [slug]);

  // AG-10 / AG-9b pilot: mars-pathfinder renders its own continuous Ares Vallis flood plain + Twin Peaks to the horizon (no plinth)
  if (slug === "mars-pathfinder") {
    return <PathfinderLandscape reducedMotion={reducedMotion} />;
  }

  const rockCount =
    slug === "mars-viking-1"
      ? 28
      : slug === "mars-pathfinder"
        ? 22
        : slug === "mars-insight"
          ? 4
          : 12;

  return (
    <group>
      {/* Warm Martian butterscotch ambient fill light */}
      <pointLight
        position={[0, 3.2, -1.5]}
        intensity={isStorm ? 4.5 : 6.5}
        distance={10}
        color={isStorm ? "#B84A24" : "#E59866"}
      />

      {/* Recessed dark-oxide museum diorama base (-0.22 m below terrain) + open outer skirt wall */}
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[3.32, 3.48, 0.36, 48]} />
        <meshStandardMaterial color="#211512" roughness={0.84} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[3.26, 3.32, 0.28, 48, 1, true]} />
        <meshStandardMaterial color="#211512" roughness={0.84} metalness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, DIORAMA_SURFACE_Y - 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.29, 48]} />
        <meshBasicMaterial color="#C8603A" transparent opacity={0.48} />
      </mesh>

      {/* Butterscotch / tan horizon haze arc behind the diorama (storm mood on Opportunity) */}
      <MarsButterscotchHazeArc isStorm={isStorm} />

      {/* Displaced Martian Regolith Terrain Patch */}
      <mesh
        name="diorama-terrain"
        geometry={terrainGeo}
        position={[0, DIORAMA_SURFACE_Y, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={regolithMap}
          bumpMap={regolithBump}
          bumpScale={0.07}
          color={isStorm ? "#8E4328" : "#FFFFFF"}
          roughness={0.94}
          metalness={0.04}
        />
      </mesh>

      {/* Airborne Martian dust particles */}
      <MarsDustParticles reducedMotion={reducedMotion} isStorm={isStorm} />

      {/* Scattered dark basalt rocks */}
      <ScatteredMarsRocks seed={slug.charCodeAt(slug.length - 1)} count={rockCount} />

      {/* ─── 1. SM-M-001 · VIKING 1 LANDER (Rock-strewn Chryse Planitia plain) ─── */}
      {slug === "mars-viking-1" ? (
        <group>
          {children}
          <Viking1SiteProps baseY={DIORAMA_SURFACE_Y} />
        </group>
      ) : null}

      {/* ─── 3. SM-M-003 · SPIRIT (Gusev Crater / "Troy": wheels sunk to hubs in bright soil beside Home Plate) ─── */}
      {slug === "mars-spirit" ? (
        <group>
          {/* Low flat-topped plateau "Home Plate" beside Spirit's sand trap at Troy */}
          <SculptedMarsLandform
            position={[-1.05, DIORAMA_SURFACE_Y + 0.02, -1.75]}
            rotation={[0, 0.25, 0]}
            width={3.3}
            depth={1.55}
            height={0.68}
            flatTop
            seed={33}
            color="#8E4E32"
          />

          {/* Bright yellowish-white disturbed ferric-sulfate soil churned up around Spirit's sunken wheels */}
          <mesh position={[0.05, DIORAMA_SURFACE_Y - 0.03, 0.08]} rotation={[-Math.PI / 2, 0, 0.2]}>
            <circleGeometry args={[1.05, 24]} />
            <meshStandardMaterial color="#DFC492" roughness={0.92} metalness={0.02} />
          </mesh>

          {/* Rover tracks + deep gouged furrow from Spirit dragging its inoperable right-front wheel */}
          <mesh position={[0.88, DIORAMA_SURFACE_Y + 0.028, 1.05]} rotation={[-Math.PI / 2, 0, -0.58]}>
            <planeGeometry args={[2.0, 0.92]} />
            <meshBasicMaterial map={trackTex} transparent opacity={0.85} depthWrite={false} />
          </mesh>
          <mesh position={[0.62, DIORAMA_SURFACE_Y + 0.032, 0.88]} rotation={[-Math.PI / 2, 0, -0.58]}>
            <planeGeometry args={[1.65, 0.18]} />
            <meshStandardMaterial color="#D8BC8A" roughness={0.95} metalness={0.02} />
          </mesh>

          {/* Spirit rover lowered (-0.17 m) & tilted so its 6 wheels are sunk up to the hubs in Troy's soft soil */}
          <group position={[0.05, -0.17, 0.08]} rotation={[0.07, 0.22, -0.16]}>
            {children}
          </group>
        </group>
      ) : null}

      {/* ─── 4. SM-M-004 · OPPORTUNITY (Perseverance Valley slope at Endeavour Crater rim, heavy 2018 storm dust) ─── */}
      {slug === "mars-opportunity" ? (
        <group>
          {/* Endeavour Crater rim ridge behind Perseverance Valley */}
          <SculptedMarsLandform
            position={[0.25, DIORAMA_SURFACE_Y + 0.14, -1.95]}
            rotation={[0, -0.12, 0]}
            width={4.2}
            depth={1.65}
            height={1.18}
            seed={44}
            color="#6E321D"
          />
          {/* Opportunity pitched on the inclined slope of Perseverance Valley */}
          <group position={[0, 0.02, 0]} rotation={[0.14, -0.28, 0.05]}>
            {children}
          </group>
        </group>
      ) : null}

      {/* ─── 5. SM-M-005 · PHOENIX (Polygon-patterned arctic ground, dug trenches with bright ice, collapsed solar array) ─── */}
      {slug === "mars-phoenix" ? (
        <group>
          {/* Excavated arctic trenches ("Dodo-Goldilocks" & "Snow Queen") exposing bright white water ice */}
          <group position={[0.14, DIORAMA_SURFACE_Y + 0.024, 1.12]} rotation={[0, -0.18, 0]}>
            {/* Dark excavated trench pit */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.42, 0.68]} />
              <meshStandardMaterial color="#4A2416" roughness={0.92} metalness={0.04} />
            </mesh>
            {/* Bright exposed subsurface water-ice layer inside the trench */}
            <mesh position={[0, 0.004, 0.04]} rotation={[-Math.PI / 2, 0, 0.12]}>
              <planeGeometry args={[0.24, 0.42]} />
              <meshStandardMaterial
                color="#E8F3FA"
                emissive="#8AB8D8"
                emissiveIntensity={0.22}
                roughness={0.28}
                metalness={0.15}
              />
            </mesh>
          </group>
          <group position={[-0.36, DIORAMA_SURFACE_Y + 0.024, 1.24]} rotation={[0, 0.14, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.32, 0.52]} />
              <meshStandardMaterial color="#4A2416" roughness={0.92} metalness={0.04} />
            </mesh>
            <mesh position={[0, 0.004, -0.02]} rotation={[-Math.PI / 2, 0, -0.08]}>
              <planeGeometry args={[0.18, 0.28]} />
              <meshStandardMaterial
                color="#E2EFF8"
                emissive="#8AB8D8"
                emissiveIntensity={0.18}
                roughness={0.3}
                metalness={0.15}
              />
            </mesh>
          </group>

          {/* Procedural AG-3b Phoenix Lander with one solar array cracked/collapsed */}
          <PhoenixLanderModel baseY={DIORAMA_SURFACE_Y} scale={0.74} />
        </group>
      ) : null}

      {/* ─── 6. SM-M-006 · INSIGHT (Smooth flat Elysium plain, dust-covered panels, SEIS dome & HP3 mole in front) ─── */}
      {slug === "mars-insight" ? (
        <group>
          <group position={[0, 0, -0.18]} scale={1.08}>
            {children}
          </group>
          <InSightSurfaceInstruments baseY={DIORAMA_SURFACE_Y} />
        </group>
      ) : null}

      {/* ─── 7. SM-M-007 · INGENUITY ("Valinor Hills" sand ripples, damaged rotor blade, Perseverance backshell mini-plinth) ─── */}
      {slug === "mars-ingenuity" ? (
        <group>
          {/* Low sandy ridge of Valinor Hills in background */}
          <SculptedMarsLandform
            position={[0.75, DIORAMA_SURFACE_Y + 0.02, -1.95]}
            rotation={[0, -0.2, 0]}
            width={3.6}
            depth={1.4}
            height={0.62}
            seed={72}
            color="#965234"
          />
          {/* Ingenuity helicopter resting on a Valinor Hills sand ripple with Flight 72 damaged rotor blade */}
          <group position={[0, 0.03, 0.1]} rotation={[0.06, -0.35, -0.05]} scale={1.08}>
            {children}
          </group>
          <IngenuityAndBackshellProps baseY={DIORAMA_SURFACE_Y} />
        </group>
      ) : null}
    </group>
  );
}
