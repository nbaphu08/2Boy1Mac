"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { beats } from "@/content/beats";
import { exhibitBySlug } from "@/content/exhibits";
import { teaserItems } from "@/content/teaser";
import type { Exhibit } from "@/content/types";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { EXHIBIT_PLINTH_ANCHORS } from "./trajectory";
import { getMoonTerrainHeight, HallOneLunarDiorama } from "./MoonDioramas";
import { ApolloLmDescentStage } from "./models/ApolloLmDescentStage";
import { HallTwoMarsDiorama } from "./MarsDioramas";
import { GrailSimulation } from "./GrailSimulation";
import { PathfinderLandscape } from "./PathfinderLandscape";
import { usePerfBudget } from "./perfTier";
import { getKaptonBumpMap } from "./rocketTextures";

const PLINTH_SURFACE_Y = 0.22;

/**
 * Enables real PCFSoftShadowMap shadow casting/receiving on opaque artifact
 * and diorama meshes (skipping translucent spotlights, dust points, craters/decals,
 * and the terrain surface which receives shadows without self-shadowing).
 */
function ShadowEnabler({
  targetRef,
  enabled,
}: {
  targetRef: React.RefObject<THREE.Group | null>;
  enabled: boolean;
}) {
  useEffect(() => {
    const root = targetRef.current;
    if (!root) return;
    const apply = () => {
      root.traverse((obj) => {
        if (!(obj as THREE.Mesh).isMesh) return;
        const mesh = obj as THREE.Mesh;
        if (mesh.name === "diorama-terrain" || mesh.name.startsWith("grail-ghost")) {
          mesh.castShadow = false;
          mesh.receiveShadow = mesh.name === "diorama-terrain" ? enabled : false;
          return;
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const hasTransparentOnly = mats.every((m) => m && m.transparent && !m.depthWrite);
        const hasWireframe = mats.some((m) => m && "wireframe" in m && (m as THREE.MeshBasicMaterial).wireframe);
        if (hasTransparentOnly || hasWireframe) {
          mesh.castShadow = false;
          mesh.receiveShadow = false;
        } else {
          mesh.castShadow = enabled;
          mesh.receiveShadow = enabled;
        }
      });
    };
    apply();
    const raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [targetRef, enabled]);
  return null;
}

function GlbExhibitMesh({
  url,
  slug,
  shadowsEnabled,
}: {
  url: string;
  slug: string;
  shadowsEnabled: boolean;
}) {
  const { scene } = useGLTF(url, false, true);
  const kaptonBump = useMemo(() => getKaptonBumpMap(), []);

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const targetSize = slug === "mars-insight"
        ? 6.0
        : slug === "mars-viking-1"
          ? 2.95
          : slug === "mars-spirit" || slug === "mars-opportunity"
            ? 2.3
            : slug === "mars-ingenuity"
              ? 1.21
              : 2.4;
    const s = targetSize / maxDim;

    // Mars exhibit state customizations per REF_MARS.md & AG-2
    const marsDustFactor =
      slug === "mars-opportunity"
        ? 0.78
        : slug === "mars-insight"
          ? 0.72
          : slug === "mars-spirit"
            ? 0.42
            : slug === "mars-viking-1"
              ? 0.24
              : 0;
    const dustColor = new THREE.Color(slug === "mars-opportunity" ? "#9C4826" : "#B8663C");

    // Material micro-detail: Kapton foil crinkle bump on metallic gold/amber foil & machined metal finish (§4)
    const isMoonGlb = slug.startsWith("moon-");
    if (marsDustFactor > 0 || slug === "mars-ingenuity" || isMoonGlb) {
      copy.traverse((child) => {
        if (slug === "mars-insight" && child.name === "SEIS") {
          // SEIS is deployed onto the Martian ground in front of the lander under its dome shield
          child.visible = false;
        }
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (!mesh.userData?.noCastShadow) {
            mesh.castShadow = shadowsEnabled;
          }
          mesh.receiveShadow = shadowsEnabled;

          if (marsDustFactor > 0 || isMoonGlb) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            const nextMats = mats.map((m) => {
              const std = m.clone() as THREE.MeshStandardMaterial;
              if (marsDustFactor > 0) {
                // Opus M7: solar arrays carry the heaviest dust film (they were mirror-blue before)
                const isArray = /panel|solar/i.test(std.name) || /panel|solar/i.test(mesh.name);
                const f = isArray ? Math.min(0.85, marsDustFactor + 0.22) : marsDustFactor;
                if (std.color) {
                  std.color.lerp(dustColor, f);
                }
                if (typeof std.roughness === "number") {
                  std.roughness = Math.min(0.96, Math.max(std.roughness, 0.35) + f * 0.5);
                }
                if (typeof std.metalness === "number") {
                  std.metalness = Math.max(0.04, std.metalness * (1 - f * (isArray ? 0.85 : 0.65)));
                }
              } else if (isMoonGlb && std.color) {
                // Crinkled Kapton gold foil detection vs bare titanium/aluminum struts
                const isGoldFoil =
                  std.color.r > 0.38 && std.color.g > 0.24 && std.color.b < std.color.r * 0.55;
                if (isGoldFoil && !std.bumpMap) {
                  std.bumpMap = kaptonBump;
                  std.bumpScale = 0.012;
                  std.roughness = Math.min(0.42, Math.max(0.24, std.roughness ?? 0.34));
                  std.metalness = Math.max(0.72, std.metalness ?? 0.78);
                }
              }
              return std;
            });
            mesh.material = Array.isArray(mesh.material) ? nextMats : nextMats[0];
          }

          // Flight 72 damaged rotor blade on Ingenuity (SM-M-007): clip one blade tip cleanly
          if (slug === "mars-ingenuity" && (child.name === "rotors_01" || mesh.name === "Cylinder.017")) {
            const geom = mesh.geometry.clone();
            const posAttr = geom.attributes.position;
            if (posAttr) {
              const nextPos = posAttr.clone();
              for (let i = 0; i < nextPos.count; i++) {
                const vx = nextPos.getX(i);
                const vz = nextPos.getZ(i);
                if (vx > 0.34 && vz > -0.08) {
                  nextPos.setX(i, 0.34);
                }
              }
              geom.setAttribute("position", nextPos);
              mesh.geometry = geom;
            }
          }
        }
      });
    }

    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, PLINTH_SURFACE_Y - box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, slug, kaptonBump, shadowsEnabled]);

  return (
    <group>
      <primitive object={cloned} scale={scale} position={offset} />
    </group>
  );
}

function PlinthFallback() {
  return (
    <mesh position={[0, PLINTH_SURFACE_Y + 0.75, 0]}>
      <octahedronGeometry args={[0.55, 0]} />
      <meshStandardMaterial color="#9DB8FF" wireframe transparent opacity={0.45} />
    </mesh>
  );
}

function SingleExhibitPlinth({
  exhibit,
  beatIndex,
  reducedMotion,
}: {
  exhibit: Exhibit;
  beatIndex: number;
  reducedMotion: boolean;
}) {
  const anchor = EXHIBIT_PLINTH_ANCHORS[exhibit.slug];
  const openExhibit = useMuseum((s) => s.openExhibit);
  const budget = usePerfBudget();
  const spinRef = useRef<THREE.Group>(null);
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const isApolloLm = exhibit.catalogNo === "SM-L-001" || exhibit.catalogNo === "SM-L-004";

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  const isMoon = anchor?.planet === "moon";
  const isGrail = exhibit.slug === "moon-grail";
  const isPathfinder = exhibit.slug === "mars-pathfinder";

  useFrame(() => {
    const p = scrollState.current;
    // Show landing site early for Moon (8) & Mars (14) orbital landings, and keep contiguous
    // half-open [minB, maxB) intervals so shared-crest midpoints swap identically without black gap.
    if (!rootRef.current) return;
    const minB = beatIndex === 8 ? 7.3 : beatIndex === 14 ? 13.35 : beatIndex - 0.5; // Opus: only once the ground is in view (no floating exhibit next to the globe)
    const maxB = beatIndex === 12 ? 12.6 : beatIndex === 20 ? 20.55 : beatIndex + 0.5;
    const visibleNow = p >= minB && p < maxB;
    rootRef.current.visible = visibleNow;
    if (!visibleNow) return;

    rootRef.current.scale.setScalar(1);
  });

  if (!anchor) return null;

  return (
    <group
      ref={rootRef}
      name={`warmup-plinth-${exhibit.slug}`}
      userData={{ warmup: true, anchorPos: anchor.pos, hall: isMoon ? "moon" : "mars", beatIndex }}
      position={anchor.pos}
      rotation={[0, anchor.rotY, 0]}
      visible={false}
      onClick={(e) => {
        e.stopPropagation();
        openExhibit(exhibit.slug);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={spinRef}>
        {isGrail ? (
          <Suspense fallback={<PlinthFallback />}>
            <GrailSimulation reducedMotion={reducedMotion} />
          </Suspense>
        ) : isPathfinder ? (
          <Suspense fallback={<PlinthFallback />}>
            <PathfinderLandscape reducedMotion={reducedMotion} />
          </Suspense>
        ) : isMoon ? (
          <HallOneLunarDiorama slug={exhibit.slug} reducedMotion={reducedMotion}>
            {isApolloLm ? (
              <Suspense fallback={<PlinthFallback />}>
                <ApolloLmDescentStage
                  groundY={PLINTH_SURFACE_Y}
                  heightFn={(x, z) => getMoonTerrainHeight(exhibit.slug, x, z)}
                  shadows={budget.tier !== "low"}
                />
              </Suspense>
            ) : exhibit.media.model ? (
              <Suspense fallback={<PlinthFallback />}>
                <GlbExhibitMesh
                  url={exhibit.media.model}
                  slug={exhibit.slug}
                  shadowsEnabled={budget.tier !== "low"}
                />
              </Suspense>
            ) : null}
          </HallOneLunarDiorama>
        ) : (
          <HallTwoMarsDiorama slug={exhibit.slug} reducedMotion={reducedMotion}>
            {exhibit.media.model ? (
              <Suspense fallback={<PlinthFallback />}>
                <GlbExhibitMesh
                  url={exhibit.media.model}
                  slug={exhibit.slug}
                  shadowsEnabled={budget.tier !== "low"}
                />
              </Suspense>
            ) : null}
          </HallTwoMarsDiorama>
        )}
        <ShadowEnabler targetRef={spinRef} enabled={budget.tier !== "low"} />
      </group>
    </group>
  );
}

/**
 * AG-4 · Beat 21 (`silence`) — The Hall of Silence 3D Memorial Field.
 * Camera pulls back from Mars into tranquil dark space; a low horizontal memorial arc of 12 light points
 * (one per Moon/Mars exhibit) dims one by one as the user scrolls, except the Apollo 11 reflector point
 * (`moon-apollo-11`, `still-active`), which stays brightly lit (`#9DB8FF` + laser pulse).
 */
function HallOfSilence3D({
  exhibitBeats,
  reducedMotion,
}: {
  exhibitBeats: { exhibit: Exhibit; index: number }[];
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRefs = useRef<(THREE.Mesh | null)[]>([]);
  const haloRefs = useRef<(THREE.Mesh | null)[]>([]);
  const stemRefs = useRef<(THREE.Mesh | null)[]>([]);
  const activeBeamRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  const activeColor = useMemo(() => new THREE.Color("#9DB8FF"), []);
  const warmAmber = useMemo(() => new THREE.Color("#DCE6FF"), []);
  const dimmedEmber = useMemo(() => new THREE.Color("#283248"), []);

  // Arrange 12 memorial beacons along a gentle horizontal arc in the upper half of the frame
  // so they glow serenely above/behind the Hall of Silence wall overlay.
  const beacons = useMemo(() => {
    const count = exhibitBeats.length;
    return exhibitBeats.map(({ exhibit }, i) => {
      const u = count > 1 ? i / (count - 1) - 0.5 : 0; // [-0.5, 0.5]
      const x = u * 26.5;
      const z = -Math.cos(u * Math.PI * 0.85) * 4.8;
      const y = Math.cos(u * Math.PI) * 0.85 + (exhibit.status === "still-active" ? 0.45 : 0);
      return {
        slug: exhibit.slug,
        stillActive: exhibit.status === "still-active",
        order: i,
        pos: [x, y, z] as [number, number, number],
      };
    });
  }, [exhibitBeats]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const p = scrollState.current;
    const vis = smoothstep(20.15, 20.6, p) * (1 - smoothstep(21.45, 21.88, p));
    groupRef.current.visible = vis > 0.01;
    if (!groupRef.current.visible) return;

    if (!reducedMotion) {
      elapsedRef.current += delta;
      groupRef.current.position.y = 533.8 + Math.sin(elapsedRef.current * 0.35) * 0.18;
    } else {
      groupRef.current.position.y = 533.8;
    }

    // Dimming progress across Beat 21: silent machines dim one by one as p moves from 20.48 -> 21.18
    const dimProgress = reducedMotion ? 1 : smoothstep(20.48, 21.18, p);
    const total = beacons.length;

    for (let i = 0; i < total; i++) {
      const b = beacons[i];
      const core = coreRefs.current[i];
      const halo = haloRefs.current[i];
      const stem = stemRefs.current[i];
      if (!core || !halo || !stem) continue;

      const coreMat = core.material as THREE.MeshBasicMaterial;
      const haloMat = halo.material as THREE.MeshBasicMaterial;
      const stemMat = stem.material as THREE.MeshBasicMaterial;

      if (b.stillActive) {
        // Apollo 11 LRRR stays brightly lit (#9DB8FF) and pulses gently
        const pulse = reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(elapsedRef.current * 2.6);
        coreMat.color.copy(activeColor);
        coreMat.opacity = vis;
        haloMat.color.copy(activeColor);
        haloMat.opacity = vis * 0.52 * pulse;
        stemMat.color.copy(activeColor);
        stemMat.opacity = vis * 0.42;
        core.scale.setScalar(1.35 * pulse);
        halo.scale.setScalar(1.55 * pulse);
      } else {
        // Each silent machine dims sequentially
        const itemStart = (i / total) * 0.72;
        const itemDim = smoothstep(itemStart, itemStart + 0.26, dimProgress);
        const stayLit = 1 - itemDim;
        coreMat.color.copy(warmAmber).lerp(dimmedEmber, itemDim);
        coreMat.opacity = vis * (0.16 + 0.78 * stayLit);
        haloMat.color.copy(warmAmber).lerp(dimmedEmber, itemDim);
        haloMat.opacity = vis * (0.04 + 0.28 * stayLit);
        stemMat.opacity = vis * (0.05 + 0.18 * stayLit);
        const sc = 0.65 + 0.35 * stayLit;
        core.scale.setScalar(sc);
        halo.scale.setScalar(sc);
      }
    }

    if (activeBeamRef.current) {
      const mat = activeBeamRef.current.material as THREE.MeshBasicMaterial;
      const pulse = reducedMotion ? 0.38 : 0.32 + 0.12 * Math.sin(elapsedRef.current * 2.6);
      mat.opacity = vis * pulse;
    }
  });

  return (
    <group ref={groupRef} position={[0, 533.8, -486]} visible={false}>
      {/* Subtle platinum horizon memorial baseline */}
      <mesh position={[0, -1.65, -2.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 30, 8]} />
        <meshBasicMaterial color="#C7CDD8" transparent opacity={0.18} />
      </mesh>

      {beacons.map((b, i) => (
        <group key={b.slug} position={b.pos}>
          {/* Vertical memorial light stem down to horizon bar */}
          <mesh
            ref={(el) => {
              stemRefs.current[i] = el;
            }}
            position={[0, -0.82, 0]}
          >
            <cylinderGeometry args={[0.014, 0.004, 1.64, 8]} />
            <meshBasicMaterial
              color={b.stillActive ? "#9DB8FF" : "#DCE6FF"}
              transparent
              opacity={0.25}
              depthWrite={false}
            />
          </mesh>

          {/* Beacon core sphere */}
          <mesh
            ref={(el) => {
              coreRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[b.stillActive ? 0.16 : 0.11, 16, 12]} />
            <meshBasicMaterial
              color={b.stillActive ? [1.35, 1.65, 2.55] : [1.45, 1.55, 1.9]}
              transparent
              opacity={0.95}
              toneMapped={false}
            />
          </mesh>

          {/* Soft outer starlight halo */}
          <mesh
            ref={(el) => {
              haloRefs.current[i] = el;
            }}
          >
            <sphereGeometry args={[b.stillActive ? 0.48 : 0.3, 16, 12]} />
            <meshBasicMaterial
              color={b.stillActive ? "#9DB8FF" : "#DCE6FF"}
              transparent
              opacity={0.35}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* Apollo 11 Reflector ("still answering") upward starlight/laser return filament */}
          {b.stillActive ? (
            <mesh ref={activeBeamRef} position={[0, 2.6, 0]}>
              <cylinderGeometry args={[0.01, 0.045, 5.2, 10, 1, true]} />
              <meshBasicMaterial
                color={[1.25, 1.55, 2.4]}
                toneMapped={false}
                transparent
                opacity={0.42}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
}

function SilhouetteModel({
  url,
  x,
  isVoyager,
  reducedMotion,
}: {
  url: string;
  x: number;
  isVoyager: boolean;
  reducedMotion: boolean;
}) {
  const { scene } = useGLTF(url, false, true);
  const spinRef = useRef<THREE.Group>(null);
  const beaconCoreRef = useRef<THREE.Mesh>(null);
  const beaconHaloRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  const { cloned, scale, offset } = useMemo(() => {
    const copy = scene.clone(true);
    // Deep unlit/dark silhouette material with cold rim specular response (AG-4 #22)
    const darkMat = new THREE.MeshStandardMaterial({
      color: "#04060B",
      emissive: "#0D172B",
      emissiveIntensity: 0.28,
      roughness: 0.26,
      metalness: 0.88,
    });
    copy.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = darkMat;
      }
    });
    const box = new THREE.Box3().setFromObject(copy);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const s = 2.45 / maxDim;
    return {
      cloned: copy,
      scale: s,
      offset: [-center.x * s, -center.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (!reducedMotion) {
      elapsedRef.current += delta;
      if (spinRef.current) {
        spinRef.current.rotation.y += delta * 0.14;
      }
    }
    // Voyager 1 (rightmost, SM-B-004) blinking "still talking" deep-space telemetry light
    if (isVoyager && beaconCoreRef.current && beaconHaloRef.current) {
      const blink = reducedMotion
        ? 0.9
        : Math.pow(0.5 + 0.5 * Math.sin(elapsedRef.current * 3.4), 3.0);
      (beaconCoreRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.75 * blink;
      (beaconHaloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.48 * blink;
      const sc = 0.85 + 0.45 * blink;
      beaconHaloRef.current.scale.setScalar(sc);
    }
  });

  return (
    <group position={[x, 0, 0]}>
      <group ref={spinRef}>
        <primitive object={cloned} scale={scale} position={offset} />
      </group>

      {/* Thin cold rim-light ring halo behind each silhouette so its dark profile pops crisply */}
      <mesh position={[0, 0, -0.55]}>
        <ringGeometry args={[1.08, 1.13, 36]} />
        <meshBasicMaterial color="#9DB8FF" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>

      {/* Voyager 1 (SM-B-004, rightmost) faint blinking "still talking" light */}
      {isVoyager ? (
        <group position={[0.18, 0.42, 0.55]}>
          <mesh ref={beaconCoreRef}>
            <sphereGeometry args={[0.065, 14, 12]} />
            <meshBasicMaterial
              color={[1.55, 1.9, 2.9]}
              transparent
              opacity={0.95}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={beaconHaloRef}>
            <sphereGeometry args={[0.24, 14, 12]} />
            <meshBasicMaterial
              color="#9DB8FF"
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

/**
 * AG-4 · Beat 22 (`beyond`) — Hall III "Beyond" Frosted-Glass Doorway & 4 Silhouettes.
 * - Tall architectural frosted-glass doorway framed in brushed platinum (`#C7CDD8`)
 * - 4 spacecraft silhouettes (`SM-B-001`..`SM-B-004`) lined up horizontally in catalogue order
 *   directly above the 4 DOM tiles near the bottom of the viewport
 * - Voyager 1 (rightmost) features a blinking "still talking" light
 */
function BeyondSilhouettes3D({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const leftDirRef = useRef<THREE.DirectionalLight>(null);
  const rightDirRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const p = scrollState.current;
    // AG-5 (22->23): Smoothly reveal from Hall of Silence and glide/part into Finale Earthrise
    const enterVis = smoothstep(21.15, 21.65, p);
    const exitProgress = smoothstep(22.15, 22.82, p);
    const vis = enterVis * (1 - exitProgress);
    if (spotRef.current) spotRef.current.intensity = 240 * vis;
    if (leftDirRef.current) leftDirRef.current.intensity = 2.4 * vis;
    if (rightDirRef.current) rightDirRef.current.intensity = 2.4 * vis;

    if (!groupRef.current) return;
    groupRef.current.visible = vis > 0.01;
    if (groupRef.current.visible) {
      groupRef.current.position.set(0, 540.1 - exitProgress * 2.8, -522 + exitProgress * 14);
      groupRef.current.scale.setScalar(0.92 + 0.08 * enterVis + exitProgress * 0.28);
    }
  });

  // Evenly spaced left->right in catalogue order SM-B-001..SM-B-004 directly above the 4 DOM tiles
  const offsets = [-5.25, -1.75, 1.75, 5.25];

  return (
    <>
      {/* Cold back-rim and key lights kept permanently visible so Three.js shader light counts never change */}
      <spotLight
        ref={spotRef}
        position={[0, 546.6, -527.5]}
        angle={1.05}
        penumbra={0.85}
        intensity={0}
        distance={32}
        color="#9DB8FF"
      />
      <directionalLight ref={leftDirRef} position={[-6, 544.1, -528]} intensity={0} color="#DCE6FF" />
      <directionalLight ref={rightDirRef} position={[6, 544.1, -528]} intensity={0} color="#9DB8FF" />
      <group
        ref={groupRef}
        name="warmup-beyond-silhouettes"
        userData={{ warmup: true, anchorPos: [0, 540.1, -522], hall: "beyond", beatIndex: 22 }}
        position={[0, 540.1, -522]}
        visible={false}
      >

      {/* ─── TALL FROSTED-GLASS MUSEUM DOORWAY (Platinum Frame #C7CDD8) ─── */}
      <group position={[0, -0.35, -1.35]}>
        {/* Frosted translucent glass portal pane (uses standard transparent material so zero transmission framebuffer readbacks occur) */}
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[15.2, 6.4]} />
          <meshStandardMaterial
            color="#0D1526"
            emissive="#162440"
            emissiveIntensity={0.32}
            roughness={0.55}
            metalness={0.22}
            transparent
            opacity={0.56}
          />
        </mesh>

        {/* Outer Brushed Platinum Doorway Frame (#C7CDD8) — Left, Right, Top Lintel, Bottom Threshold */}
        <mesh position={[-7.68, 0, 0]}>
          <boxGeometry args={[0.18, 6.58, 0.22]} />
          <meshStandardMaterial color="#C7CDD8" roughness={0.32} metalness={0.82} />
        </mesh>
        <mesh position={[7.68, 0, 0]}>
          <boxGeometry args={[0.18, 6.58, 0.22]} />
          <meshStandardMaterial color="#C7CDD8" roughness={0.32} metalness={0.82} />
        </mesh>
        <mesh position={[0, 3.22, 0]}>
          <boxGeometry args={[15.54, 0.18, 0.24]} />
          <meshStandardMaterial color="#C7CDD8" roughness={0.32} metalness={0.82} />
        </mesh>
        <mesh position={[0, -3.22, 0]}>
          <boxGeometry args={[15.54, 0.14, 0.28]} />
          <meshStandardMaterial color="#C7CDD8" roughness={0.35} metalness={0.78} />
        </mesh>

        {/* 3 Vertical Platinum Mullion Dividers separating the 4 silhouette bays */}
        {[-3.5, 0, 3.5].map((mx) => (
          <mesh key={mx} position={[mx, 0, -0.04]}>
            <boxGeometry args={[0.045, 6.32, 0.08]} />
            <meshStandardMaterial color="#C7CDD8" roughness={0.38} metalness={0.75} transparent opacity={0.55} />
          </mesh>
        ))}

        {/* Inner Starlight Edge Glow Strip around the doorway perimeter */}
        <mesh position={[0, 3.11, 0.06]}>
          <boxGeometry args={[15.16, 0.025, 0.02]} />
          <meshBasicMaterial color="#9DB8FF" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0, -3.13, 0.06]}>
          <boxGeometry args={[15.16, 0.025, 0.02]} />
          <meshBasicMaterial color="#9DB8FF" transparent opacity={0.45} />
        </mesh>
      </group>

      {/* ─── 4 SPACECRAFT SILHOUETTES (SM-B-001..SM-B-004) ─── */}
      {teaserItems.map((item, idx) => (
        <Suspense key={item.catalogNo} fallback={null}>
          <SilhouetteModel
            url={item.model}
            x={offsets[idx]}
            isVoyager={item.catalogNo === "SM-B-004"}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      ))}
      </group>
    </>
  );
}

/**
 * Mounts all 12 Moon + Mars exhibit plinths + Hall of Silence + Hall III silhouettes.
 * Staggers plinth mounting over initial idle ticks during launch beats (0..5) so boot
 * doesn't hitch and ALL geometries + GLBs are loaded and ready for GPU pre-compilation before p = 6.5.
 */
export function ExhibitStage3D({ reducedMotion }: { reducedMotion: boolean }) {
  const exhibitBeats = useMemo(
    () =>
      beats
        .map((b, i) => ({ beat: b, index: i, exhibit: b.exhibitSlug ? exhibitBySlug(b.exhibitSlug) : undefined }))
        .filter((x): x is { beat: (typeof beats)[number]; index: number; exhibit: Exhibit } => !!x.exhibit),
    [],
  );

  const [mountedCount, setMountedCount] = useState(2);
  const flushedRef = useRef(false);

  // Start preloading ALL GLBs + GRAIL textures immediately at mount
  useEffect(() => {
    const urls = new Set<string>();
    exhibitBeats.forEach((x) => {
      if (x.exhibit.media.model) urls.add(x.exhibit.media.model);
    });
    teaserItems.forEach((t) => urls.add(t.model));
    urls.forEach((u) => useGLTF.preload(u, false, true));
    useTexture.preload("/media/three/grail/grail_gravity_2k.webp");
    useTexture.preload("/media/three/grail/grail_gravity_4k.webp");
  }, [exhibitBeats]);

  // Stagger remaining plinth mounts smoothly across initial idle chunks (or flush immediately if user scrolls early)
  useEffect(() => {
    if (mountedCount >= exhibitBeats.length) {
      flushedRef.current = true;
      return;
    }
    const step = () => {
      if (scrollState.target >= 3.5) {
        flushedRef.current = true;
        setMountedCount(exhibitBeats.length);
      } else {
        setMountedCount((c) => Math.min(exhibitBeats.length, c + 2));
      }
    };
    const w = window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(step, { timeout: 140 });
      return () => w.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(step, 70);
    return () => window.clearTimeout(timer);
  }, [mountedCount, exhibitBeats.length]);

  useFrame(() => {
    if (!flushedRef.current && mountedCount < exhibitBeats.length && scrollState.target >= 4.2) {
      flushedRef.current = true;
      setMountedCount(exhibitBeats.length);
    }
  });

  return (
    <>
      {exhibitBeats.slice(0, mountedCount).map(({ exhibit, index }) => (
        <SingleExhibitPlinth
          key={exhibit.slug}
          exhibit={exhibit}
          beatIndex={index}
          reducedMotion={reducedMotion}
        />
      ))}
      <HallOfSilence3D exhibitBeats={exhibitBeats} reducedMotion={reducedMotion} />
      <BeyondSilhouettes3D reducedMotion={reducedMotion} />
    </>
  );
}
