"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { beats } from "@/content/beats";
import { useMuseum } from "@/lib/store";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { CelestialWorlds } from "./CelestialWorlds";
import { ExhibitStage3D } from "./ExhibitStage3D";
import { ExpeditionEffects } from "./ExpeditionEffects";
import { LaunchComplex } from "./LaunchComplex";
import { HallEnvironment, PostEffects } from "./RenderPipeline";
import { SLSRocket } from "./SLSRocket";
import { detectInitialPerfTier, usePerfBudget } from "./perfTier";
import { grailSimState } from "./simulationBus";
import { sharedTerrainUniforms } from "./landscapeMaterials";
import { applyExpeditionCamera, updateExpeditionState } from "./expeditionCamera";
import {
  EXHIBIT_PLINTH_ANCHORS,
  sampleCameraBankRoll,
  sampleTrajectory,
  type SampledTrajectory,
} from "./trajectory";

const MOON_SITE_SLUGS = [
  "moon-apollo-11",
  "moon-surveyor-3",
  "moon-apollo-15-lrv",
  "moon-apollo-17",
  "moon-grail",
] as const;

const MARS_SITE_SLUGS = [
  "mars-viking-1",
  "mars-pathfinder",
  "mars-spirit",
  "mars-opportunity",
  "mars-phoenix",
  "mars-insight",
  "mars-ingenuity",
] as const;

function sampleInterpolatedSitePos(p: number, outPos: THREE.Vector3) {
  if (p < 13.0) {
    const u = THREE.MathUtils.clamp(p - 8, 0, MOON_SITE_SLUGS.length - 1);
    const i = Math.min(MOON_SITE_SLUGS.length - 2, Math.floor(u));
    const t = smoothstep(0.25, 0.75, u - i);
    const a = EXHIBIT_PLINTH_ANCHORS[MOON_SITE_SLUGS[i]].pos;
    const b = EXHIBIT_PLINTH_ANCHORS[MOON_SITE_SLUGS[i + 1]].pos;
    outPos.set(
      THREE.MathUtils.lerp(a[0], b[0], t),
      THREE.MathUtils.lerp(a[1], b[1], t),
      THREE.MathUtils.lerp(a[2], b[2], t),
    );
    return;
  }
  const u = THREE.MathUtils.clamp(p - 14, 0, MARS_SITE_SLUGS.length - 1);
  const i = Math.min(MARS_SITE_SLUGS.length - 2, Math.floor(u));
  const t = smoothstep(0.25, 0.75, u - i);
  const a = EXHIBIT_PLINTH_ANCHORS[MARS_SITE_SLUGS[i]].pos;
  const b = EXHIBIT_PLINTH_ANCHORS[MARS_SITE_SLUGS[i + 1]].pos;
  outPos.set(
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  );
}

function SceneChoreographer({
  rocketRef,
  reducedMotion,
}: {
  rocketRef: React.RefObject<THREE.Group | null>;
  reducedMotion: boolean;
}) {
  const camera = useThree((s) => s.camera);
  const activeExhibit = useMuseum((s) => s.activeExhibit);
  const budget = usePerfBudget();
  const useShadows = budget.tier !== "low";
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const marsModelSpotRef = useRef<THREE.SpotLight>(null);
  const grailImpactLightRef = useRef<THREE.PointLight>(null);
  const elapsedRef = useRef(0);
  const shadowModeRef = useRef<"pad" | "exhibit">("pad");
  const sunTarget = useMemo(() => new THREE.Object3D(), []);
  const marsSpotTarget = useMemo(() => new THREE.Object3D(), []);
  const siteFocusPos = useMemo(() => new THREE.Vector3(), []);
  const simCamPos = useMemo(() => new THREE.Vector3(), []);
  const simCamLook = useMemo(() => new THREE.Vector3(), []);
  const duskSunColor = useMemo(() => new THREE.Color("#FF964C"), []);
  const orbitalSunColor = useMemo(() => new THREE.Color("#F5F8FF"), []);
  const moonSunColor = useMemo(() => new THREE.Color("#FFFDF7"), []);
  const marsSunColor = useMemo(() => new THREE.Color("#FFD6B0"), []);
  const duskRimColor = useMemo(() => new THREE.Color("#5280EA"), []);
  const orbitalRimColor = useMemo(() => new THREE.Color("#6E96FF"), []);
  const duskHemiSky = useMemo(() => new THREE.Color("#4D75CA"), []);
  const orbitalHemiSky = useMemo(() => new THREE.Color("#ADC8FF"), []);
  const moonHemiSky = useMemo(() => new THREE.Color("#11131A"), []);
  const marsHemiSky = useMemo(() => new THREE.Color("#D89362"), []);
  const duskHemiGround = useMemo(() => new THREE.Color("#2A1A14"), []);
  const orbitalHemiGround = useMemo(() => new THREE.Color("#0A0E18"), []);
  const moonHemiGround = useMemo(() => new THREE.Color("#07090F"), []);
  const marsHemiGround = useMemo(() => new THREE.Color("#5C2E1B"), []);
  const moonAmbColor = useMemo(() => new THREE.Color("#0A0C12"), []);
  const marsAmbColor = useMemo(() => new THREE.Color("#54301E"), []);
  const orbitalAmbColor = useMemo(() => new THREE.Color("#1A2644"), []);

  const traj = useMemo<SampledTrajectory>(
    () => ({
      camPos: new THREE.Vector3(),
      camLook: new THREE.Vector3(),
      rocketPos: new THREE.Vector3(),
      rocketRot: new THREE.Euler(),
      rocketScale: 1,
    }),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    const prev = scrollState.current;
    if (reducedMotion || Math.abs(scrollState.target - prev) > 1.5) {
      // Instant cut on reducedMotion or rail/hash jumps (|Δp| > 1.5) so fast jumps never render broken intermediate terrain
      scrollState.current = scrollState.target;
      scrollState.velocity = 0;
    } else {
      elapsedRef.current += dt;
      scrollState.current = THREE.MathUtils.damp(prev, scrollState.target, 8.5, dt);
      scrollState.velocity = (scrollState.current - prev) / Math.max(dt, 0.001);
    }

    const p = scrollState.current;
    updateExpeditionState(p);
    sampleTrajectory(p, traj);
    applyExpeditionCamera(p, reducedMotion, traj);

    const t = elapsedRef.current;
    // Subtle life only (<= 0.15 deg resting drift) + acoustic ignition shake ONLY around ignition/liftoff (beat 2)
    const inTrackingFlight = (p > 7.05 && p < 7.9) || (p > 13.05 && p < 13.9);
    const breathScale = inTrackingFlight ? 0.12 : 0.18;
    const breathX = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.024 * breathScale;
    const breathY = reducedMotion ? 0 : Math.cos(t * 0.31) * 0.018 * breathScale;
    const liftoffRumble = reducedMotion
      ? 0
      : smoothstep(1.82, 1.98, p) * (1 - smoothstep(2.25, 2.52, p));
    const shakeX = liftoffRumble * Math.sin(t * 52) * 0.2;
    const shakeY = liftoffRumble * Math.cos(t * 59) * 0.15;

    // Tiny micro-orbit (<= 0.15 deg = 0.0026 rad) when genuinely settled on an exhibit rest beat
    const inExhibitRange = smoothstep(7.7, 8.0, p) * (1 - smoothstep(20.1, 20.4, p));
    const nearRestBeat = 1 - smoothstep(0.05, 0.12, Math.abs(p - Math.round(p)));
    const isResting = 1 - smoothstep(0.05, 0.3, Math.abs(scrollState.velocity));
    const orbitWeight = reducedMotion ? 0 : inExhibitRange * nearRestBeat * isResting;

    const dx = traj.camPos.x - traj.camLook.x;
    const dz = traj.camPos.z - traj.camLook.z;
    const orbitAngle = Math.sin(t * 0.34) * 0.0024 * orbitWeight;
    const cosA = Math.cos(orbitAngle);
    const sinA = Math.sin(orbitAngle);
    const orbitedX = traj.camLook.x + dx * cosA - dz * sinA;
    const orbitedZ = traj.camLook.z + dx * sinA + dz * cosA;
    const orbitLiftY = Math.cos(t * 0.28) * 0.014 * orbitWeight;

    simCamPos.set(
      orbitedX + breathX + shakeX,
      traj.camPos.y + breathY + shakeY + orbitLiftY,
      orbitedZ,
    );
    simCamLook.copy(traj.camLook);

    // Smoothly blend camera toward GRAIL 14 s simulation when settled on beat 12 (yields instantly on scroll)
    if (grailSimState.active && grailSimState.camBlend > 0.001) {
      const scrollMask = 1 - smoothstep(0.26, 0.36, Math.abs(p - 12)); // Opus: wider window
      const blend = grailSimState.camBlend * scrollMask;
      if (blend > 0.001) {
        simCamPos.lerp(grailSimState.camPos, blend);
        simCamLook.lerp(grailSimState.camLook, blend);
      }
    }

    camera.position.copy(simCamPos);
    camera.lookAt(simCamLook);
    const bankRoll = sampleCameraBankRoll(p);
    if (!reducedMotion && Math.abs(bankRoll) > 1e-4) {
      camera.rotateZ(bankRoll);
    }

    if (rocketRef.current) {
      // Keep rocket subtree visible=true always so its 2 engine/pad point lights never trigger shader recompilation
      rocketRef.current.visible = true;
      if (p >= 20.8 && p <= 22.7) {
        rocketRef.current.position.set(0, -5000, 0);
      } else {
        rocketRef.current.position.copy(traj.rocketPos);
      }
      rocketRef.current.rotation.copy(traj.rocketRot);
      rocketRef.current.scale.setScalar(traj.rocketScale);
    }

    const dim = activeExhibit ? 0.4 : 1.0;
    const orbitalT = smoothstep(2.05, 3.45, p);
    const inMoonHall = p >= 7.12 && p <= 12.6;
    const inMarsHall = p >= 13.18 && p <= 20.55;
    const inAnyExhibit = inMoonHall || inMarsHall;

    sampleInterpolatedSitePos(p, siteFocusPos);
    if (inMoonHall) {
      sharedTerrainUniforms.moonFocusXZ.value.set(siteFocusPos.x, siteFocusPos.z);
    } else if (inMarsHall) {
      sharedTerrainUniforms.marsFocusXZ.value.set(siteFocusPos.x, siteFocusPos.z);
    }
    const stormT = smoothstep(16.6, 16.9, p) * (1 - smoothstep(17.1, 17.4, p));
    sharedTerrainUniforms.marsStormMix.value = stormT;

    if (marsModelSpotRef.current) {
      const marsSpotVis = smoothstep(13.25, 13.7, p) * (1 - smoothstep(20.1, 20.55, p));
      marsModelSpotRef.current.position.set(siteFocusPos.x, siteFocusPos.y + 7.2, siteFocusPos.z + 1.5);
      marsSpotTarget.position.set(siteFocusPos.x, siteFocusPos.y + 0.4, siteFocusPos.z);
      marsSpotTarget.updateMatrixWorld();
      marsModelSpotRef.current.intensity = (inMarsHall ? 34 * marsSpotVis : 0) * dim;
    }

    if (grailImpactLightRef.current) {
      const grailVis = Math.max(0, 1 - smoothstep(0.18, 0.42, Math.abs(p - 12)));
      grailImpactLightRef.current.position.copy(grailSimState.impactPos);
      grailImpactLightRef.current.intensity = grailSimState.impactIntensity * grailVis * dim;
    }

    if (sunRef.current) {
      const targetMode: "pad" | "exhibit" = inAnyExhibit ? "exhibit" : "pad";
      if (shadowModeRef.current !== targetMode) {
        shadowModeRef.current = targetMode;
        const sc = sunRef.current.shadow.camera;
        if (targetMode === "exhibit") {
          sc.left = -13.5;
          sc.right = 13.5;
          sc.top = 13.5;
          sc.bottom = -13.5;
          sc.near = 1;
          sc.far = 54;
        } else {
          sc.left = -24;
          sc.right = 26;
          sc.top = 24;
          sc.bottom = -14;
          sc.near = 10;
          sc.far = 165;
        }
        sc.updateProjectionMatrix();
      }

      // Keep castShadow constant (never toggle mid-scroll) so WebGL shadow defines never recompile
      sunRef.current.castShadow = useShadows;
      if (inAnyExhibit) {
        const ax = siteFocusPos.x;
        const ay = siteFocusPos.y;
        const az = siteFocusPos.z;
        sunTarget.position.set(ax, ay + 0.35, az);
        sunTarget.updateMatrixWorld();
        if (inMoonHall) {
          // Single hard crisp low white lunar sun from right-front
          sunRef.current.position.set(ax + 9.4, ay + 2.85, az + 4.3);
          sunRef.current.color.copy(moonSunColor);
          sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, 3.8 * dim, 8, dt);
        } else {
          // Warm low Martian sun smoothly modulated across storm site (beat 17)
          sunRef.current.position.set(ax - 8.4, ay + 3.25, az + 5.4);
          sunRef.current.color.copy(marsSunColor);
          const marsIntensity = THREE.MathUtils.lerp(3.85, 2.75, stormT) * dim;
          sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, marsIntensity, 8, dt);
        }
      } else {
        sunTarget.position.set(0, 4, 0);
        sunTarget.updateMatrixWorld();
        sunRef.current.position.set(
          THREE.MathUtils.lerp(-78, 65, orbitalT),
          THREE.MathUtils.lerp(9.5, 95, orbitalT),
          THREE.MathUtils.lerp(-42, 85, orbitalT),
        );
        sunRef.current.color.copy(duskSunColor).lerp(orbitalSunColor, orbitalT);
        const targetSun = THREE.MathUtils.lerp(3.55, 3.1, orbitalT) * dim;
        sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, targetSun, 6, dt);
      }
    }
    if (rimRef.current) {
      if (inMoonHall) {
        // Airless black lunar sky -> zero secondary rim fill
        rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, 0.0, 8, dt);
      } else {
        rimRef.current.color.copy(duskRimColor).lerp(orbitalRimColor, orbitalT);
        const targetRim = (inMarsHall ? 0.55 : THREE.MathUtils.lerp(1.05, 0.85, orbitalT)) * dim;
        rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, targetRim, 6, dt);
      }
    }
    if (ambRef.current) {
      if (inMoonHall) {
        ambRef.current.color.copy(moonAmbColor);
        ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.01 * dim, 8, dt);
      } else if (inMarsHall) {
        ambRef.current.color.copy(marsAmbColor);
        ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.38 * dim, 8, dt);
      } else {
        ambRef.current.color.copy(orbitalAmbColor);
        ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.42 * dim, 6, dt);
      }
    }
    if (hemiRef.current) {
      if (inMoonHall) {
        hemiRef.current.color.copy(moonHemiSky);
        hemiRef.current.groundColor.copy(moonHemiGround);
        hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, 0.016 * dim, 8, dt);
      } else if (inMarsHall) {
        hemiRef.current.color.copy(marsHemiSky);
        hemiRef.current.groundColor.copy(marsHemiGround);
        hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, 0.56 * dim, 8, dt);
      } else {
        hemiRef.current.color.copy(duskHemiSky).lerp(orbitalHemiSky, orbitalT);
        hemiRef.current.groundColor.copy(duskHemiGround).lerp(orbitalHemiGround, orbitalT);
        const targetHemi = THREE.MathUtils.lerp(0.58, 0.48, orbitalT) * dim;
        hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, targetHemi, 6, dt);
      }
    }
  });

  return (
    <>
      <primitive object={sunTarget} />
      <primitive object={marsSpotTarget} />
      <ambientLight ref={ambRef} color="#1A2644" intensity={0.42} />
      <hemisphereLight ref={hemiRef} args={["#4D75CA", "#2A1A14", 0.58]} />
      <directionalLight
        key={budget.tier}
        ref={sunRef}
        target={sunTarget}
        position={[-58, 15, -22]}
        color="#FF9852"
        intensity={3.65}
        castShadow={useShadows}
        shadow-mapSize={budget.tier === "high" ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={26}
        shadow-camera-top={24}
        shadow-camera-bottom={-14}
        shadow-camera-near={10}
        shadow-camera-far={165}
        shadow-bias={-0.00025}
        shadow-normalBias={0.01}
      />
      <directionalLight ref={rimRef} position={[48, 22, -45]} color="#5280EA" intensity={1.05} />
      {/* Permanent Mars modeling spotlight & GRAIL impact flash light so scene light count never mutates */}
      <spotLight
        ref={marsModelSpotRef}
        target={marsSpotTarget}
        position={[7, 480, -374.5]}
        angle={0.62}
        penumbra={0.92}
        intensity={0}
        distance={22}
        color="#DCE6FF"
      />
      <pointLight
        ref={grailImpactLightRef}
        position={[405.5, 336, -176]}
        intensity={0}
        distance={14}
        decay={2}
        color="#FFAE6B"
      />
    </>
  );
}

const TEX_SLOTS = [
  "map",
  "bumpMap",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "emissiveMap",
  "aoMap",
  "alphaMap",
] as const;

function initSubtreeTextures(
  gl: THREE.WebGLRenderer,
  root: THREE.Object3D,
  warmedTexIds: Set<number>,
) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    const matOrArr = mesh.material;
    if (!matOrArr) return;
    const mats = Array.isArray(matOrArr) ? matOrArr : [matOrArr];
    for (const m of mats) {
      const rec = m as unknown as Record<string, unknown>;
      for (const slot of TEX_SLOTS) {
        const tex = rec[slot];
        if (tex instanceof THREE.Texture && !warmedTexIds.has(tex.id)) {
          warmedTexIds.add(tex.id);
          gl.initTexture(tex);
        }
      }
      if (m instanceof THREE.ShaderMaterial && m.uniforms) {
        for (const u of Object.values(m.uniforms)) {
          if (u?.value instanceof THREE.Texture && !warmedTexIds.has(u.value.id)) {
            warmedTexIds.add(u.value.id);
            gl.initTexture(u.value);
          }
        }
      }
    }
  });
}

function countSubtreeRenderables(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((obj) => {
    const anyObj = obj as THREE.Mesh & THREE.Points & THREE.Line;
    if (anyObj.isMesh || anyObj.isPoints || anyObj.isLine) {
      count++;
    }
  });
  return count;
}

function positionWarmupCamera(offCam: THREE.PerspectiveCamera, target: THREE.Object3D) {
  const anchor = target.userData?.anchorPos as [number, number, number] | undefined;
  const camPos = target.userData?.camPos as [number, number, number] | undefined;
  if (!anchor) return;
  if (camPos) {
    offCam.position.set(camPos[0], camPos[1], camPos[2]);
  } else {
    offCam.position.set(anchor[0], anchor[1] + 2.8, anchor[2] + 8.5);
  }
  offCam.lookAt(anchor[0], anchor[1] + 0.6, anchor[2]);
  offCam.updateMatrixWorld(true);
}

function collectVisibilitySnapshot(target: THREE.Object3D, scene: THREE.Scene) {
  const saved: [THREE.Object3D, boolean][] = [];
  let parent = target.parent;
  while (parent && parent !== scene) {
    saved.push([parent, parent.visible]);
    parent = parent.parent;
  }
  target.traverse((node) => {
    if (node.userData?.skipWarmup) return;
    saved.push([node, node.visible]);
  });
  return saved;
}

function forceSnapshotVisible(saved: [THREE.Object3D, boolean][], target: THREE.Object3D) {
  for (const [node] of saved) {
    node.visible = true;
  }
  target.updateMatrixWorld(true);
}

function restoreSnapshotVisible(saved: [THREE.Object3D, boolean][]) {
  for (let i = saved.length - 1; i >= 0; i--) {
    saved[i][0].visible = saved[i][1];
  }
}

/**
 * AG-13 §1 + AG-16b: Staggered GPU asset & shader warmup during launch beats (0..2).
 * Uploads all textures (`gl.initTexture`), runs `compileAsync` with full descendant visibility,
 * and renders a 16x16 offscreen RT pass per earth/sky/rocket/planet/exhibit target so
 * transitions at TLI (6.6), Mars (14..20), Beyond (22) and Finale (23) never lazily compile mid-scroll.
 */
function MaterialPrewarmer() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const warmedMeshCountsRef = useRef(new Map<string, number>());
  const warmedTexIdsRef = useRef(new Set<number>());
  const inFlightRef = useRef(false);
  const offCamRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rtRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const coreCompiledRef = useRef(false);

  useEffect(() => {
    const offCam = new THREE.PerspectiveCamera(45, 1, 0.2, 2600);
    const rt = new THREE.WebGLRenderTarget(16, 16, {
      depthBuffer: true,
      stencilBuffer: false,
    });
    offCamRef.current = offCam;
    rtRef.current = rt;

    let cancelled = false;

    const collectTargets = (): THREE.Object3D[] => {
      const targets: THREE.Object3D[] = [];
      scene.traverse((obj) => {
        if (!obj.userData?.warmup || !obj.name) return;
        const prevCount = warmedMeshCountsRef.current.get(obj.name);
        const curCount = countSubtreeRenderables(obj);
        if (prevCount === undefined || curCount > prevCount) {
          targets.push(obj);
        }
      });
      targets.sort((a, b) => Number(a.userData?.beatIndex ?? 99) - Number(b.userData?.beatIndex ?? 99));
      return targets;
    };

    const warmOne = async (target: THREE.Object3D) => {
      if (cancelled || !offCamRef.current || !rtRef.current) return;
      const curCount = countSubtreeRenderables(target);
      warmedMeshCountsRef.current.set(target.name, curCount);
      initSubtreeTextures(gl, target, warmedTexIdsRef.current);

      const savedVis = collectVisibilitySnapshot(target, scene);
      try {
        forceSnapshotVisible(savedVis, target);
        positionWarmupCamera(offCamRef.current, target);

        try {
          await gl.compileAsync(target, offCamRef.current, scene);
        } catch {
          gl.compile(scene, offCamRef.current);
        }

        if (!cancelled && rtRef.current && offCamRef.current) {
          // Re-assert subtree visibility synchronously right before RT render so useFrame never hides children mid-await
          forceSnapshotVisible(savedVis, target);
          const prevAutoShadow = gl.shadowMap.autoUpdate;
          gl.shadowMap.autoUpdate = false;
          const prevTarget = gl.getRenderTarget();
          try {
            gl.setRenderTarget(rtRef.current);
            gl.render(scene, offCamRef.current);
          } finally {
            gl.setRenderTarget(prevTarget);
            gl.shadowMap.autoUpdate = prevAutoShadow;
          }
        }
      } finally {
        restoreSnapshotVisible(savedVis);
      }
    };

    const tick = async () => {
      if (cancelled || inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        if (!coreCompiledRef.current) {
          coreCompiledRef.current = true;
          initSubtreeTextures(gl, scene, warmedTexIdsRef.current);
          try {
            await gl.compileAsync(scene, camera, scene);
          } catch {
            gl.compile(scene, camera);
          }
        }
        const pending = collectTargets();
        if (pending.length > 0) {
          await warmOne(pending[0]);
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void tick();
      }
    }, 55);

    const bootTimer = window.setTimeout(() => {
      void tick();
    }, 35);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(bootTimer);
      rt.dispose();
      rtRef.current = null;
      offCamRef.current = null;
    };
  }, [gl, scene, camera]);

  // Safety flush: synchronously warm upcoming hall targets if user jumps fast before idle queue finishes
  useFrame(() => {
    const p = Math.max(scrollState.current, scrollState.target);
    const needLaunch = p >= 1.2 && p < 6.8;
    const needMoon = p >= 5.2 && p < 7.6;
    const needMars = p >= 11.0 && p < 20.6;
    const needBeyond = p >= 18.5;
    if (!needLaunch && !needMoon && !needMars && !needBeyond) return;
    if (!offCamRef.current || !rtRef.current) return;

    scene.traverse((obj) => {
      if (!obj.userData?.warmup || !obj.name) return;
      const hall = obj.userData.hall;
      const match =
        (needLaunch && hall === "launch") ||
        (needMoon && hall === "moon") ||
        (needMars && hall === "mars") ||
        (needBeyond && hall === "beyond");
      if (!match) return;

      const curCount = countSubtreeRenderables(obj);
      const prevCount = warmedMeshCountsRef.current.get(obj.name);
      if (prevCount !== undefined && curCount <= prevCount) return;

      warmedMeshCountsRef.current.set(obj.name, curCount);
      initSubtreeTextures(gl, obj, warmedTexIdsRef.current);

      const savedVis = collectVisibilitySnapshot(obj, scene);
      const prevAutoShadow = gl.shadowMap.autoUpdate;
      const prevRt = gl.getRenderTarget();
      try {
        forceSnapshotVisible(savedVis, obj);
        if (offCamRef.current && rtRef.current) {
          positionWarmupCamera(offCamRef.current, obj);
          gl.compile(scene, offCamRef.current);
          gl.shadowMap.autoUpdate = false;
          gl.setRenderTarget(rtRef.current);
          gl.render(scene, offCamRef.current);
        }
      } finally {
        gl.setRenderTarget(prevRt);
        gl.shadowMap.autoUpdate = prevAutoShadow;
        restoreSnapshotVisible(savedVis);
      }
    });
  });

  return null;
}

export default function SpaceScene() {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const budget = usePerfBudget();
  const rocketRef = useRef<THREE.Group | null>(null);
  const [isPageHidden, setIsPageHidden] = useState(false);

  // AG-6 S-6 #3: Pause the R3F render loop when document.hidden (0% CPU in background tab)
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsPageHidden(document.hidden);
    };
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // AG-7: Support ?poster=<beatId|slug> for clean still poster capture (locks beat & hides DOM UI)
  const [posterBeat] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const posterId = params.get("poster");
    if (!posterId) return null;
    const idx = beats.findIndex((b) => b.id === posterId || b.exhibitSlug === posterId);
    return idx >= 0 ? idx : null;
  });

  useEffect(() => {
    if (posterBeat !== null) {
      scrollState.target = posterBeat;
      scrollState.current = posterBeat;
      scrollState.velocity = 0;
    }
  }, [posterBeat]);

  return (
    <div aria-hidden className={`fixed inset-0 bg-void ${posterBeat !== null ? "z-50" : "z-0"}`}>
      <Canvas
        shadows={budget.tier !== "low" ? "soft" : false}
        frameloop={isPageHidden ? "never" : "always"}
        dpr={reducedMotion ? 1 : budget.dpr}
        camera={{ fov: 44, near: 0.25, far: 2600, position: [14, 5.2, 23] }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          detectInitialPerfTier(gl);
        }}
        gl={{
          antialias: budget.tier === "low",
          preserveDrawingBuffer: posterBeat !== null,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.06,
        }}
      >
        <color attach="background" args={["#04060B"]} />
        <SceneChoreographer rocketRef={rocketRef} reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          <HallEnvironment />
          <CelestialWorlds reducedMotion={reducedMotion} />
          <LaunchComplex reducedMotion={reducedMotion} />
          <SLSRocket rocketRef={rocketRef} reducedMotion={reducedMotion} />
          <ExhibitStage3D reducedMotion={reducedMotion} />
          <ExpeditionEffects reducedMotion={reducedMotion} />
          <PostEffects />
          <MaterialPrewarmer />
        </Suspense>
      </Canvas>
    </div>
  );
}
