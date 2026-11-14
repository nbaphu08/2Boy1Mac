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
import { detectInitialPerfTier, updatePerfFpsMonitor, usePerfBudget } from "./perfTier";
import { grailSimState } from "./simulationBus";
import { applyExpeditionCamera, updateExpeditionState } from "./expeditionCamera";
import { EXHIBIT_PLINTH_ANCHORS, sampleTrajectory, type SampledTrajectory } from "./trajectory";

function SceneChoreographer({
  rocketRef,
  veilRef,
  reducedMotion,
}: {
  rocketRef: React.RefObject<THREE.Group | null>;
  veilRef: React.RefObject<HTMLDivElement | null>;
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
  const elapsedRef = useRef(0);
  const shadowModeRef = useRef<"pad" | "exhibit">("pad");
  const sunTarget = useMemo(() => new THREE.Object3D(), []);
  const simCamPos = useMemo(() => new THREE.Vector3(), []);
  const simCamLook = useMemo(() => new THREE.Vector3(), []);
  const duskSunColor = useMemo(() => new THREE.Color("#FF9852"), []);
  const orbitalSunColor = useMemo(() => new THREE.Color("#F5F8FF"), []);
  const moonSunColor = useMemo(() => new THREE.Color("#FFFDF5"), []);
  const marsSunColor = useMemo(() => new THREE.Color("#FFD6B0"), []);
  const duskRimColor = useMemo(() => new THREE.Color("#5280EA"), []);
  const orbitalRimColor = useMemo(() => new THREE.Color("#6E96FF"), []);
  const duskHemiSky = useMemo(() => new THREE.Color("#4D75CA"), []);
  const orbitalHemiSky = useMemo(() => new THREE.Color("#ADC8FF"), []);
  const moonHemiSky = useMemo(() => new THREE.Color("#1E2434"), []);
  const marsHemiSky = useMemo(() => new THREE.Color("#D89362"), []);
  const duskHemiGround = useMemo(() => new THREE.Color("#2A1A14"), []);
  const orbitalHemiGround = useMemo(() => new THREE.Color("#0A0E18"), []);
  const moonHemiGround = useMemo(() => new THREE.Color("#181614"), []);
  const marsHemiGround = useMemo(() => new THREE.Color("#5C2E1B"), []);
  const moonAmbColor = useMemo(() => new THREE.Color("#0D121D"), []);
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
    updatePerfFpsMonitor(dt);

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
    // Living breathing drift + subtle acoustic rumble at liftoff (beat 2)
    const inTrackingFlight = (p > 7.05 && p < 7.9) || (p > 13.05 && p < 13.9);
    const breathScale = inTrackingFlight ? 0.3 : 1.0;
    const breathX = reducedMotion ? 0 : Math.sin(t * 0.42) * 0.1 * breathScale;
    const breathY = reducedMotion ? 0 : Math.cos(t * 0.31) * 0.075 * breathScale;
    const liftoffRumble = reducedMotion
      ? 0
      : smoothstep(1.82, 1.98, p) * (1 - smoothstep(2.25, 2.52, p));
    const shakeX = liftoffRumble * Math.sin(t * 52) * 0.2;
    const shakeY = liftoffRumble * Math.cos(t * 59) * 0.15;

    // Subtle camera micro-orbit only while genuinely settled near an integer exhibit rest beat
    const inExhibitRange = smoothstep(7.7, 8.0, p) * (1 - smoothstep(20.1, 20.4, p));
    const nearRestBeat = 1 - smoothstep(0.05, 0.12, Math.abs(p - Math.round(p)));
    const isResting = 1 - smoothstep(0.05, 0.3, Math.abs(scrollState.velocity));
    const orbitWeight = reducedMotion ? 0 : inExhibitRange * nearRestBeat * isResting;

    const dx = traj.camPos.x - traj.camLook.x;
    const dz = traj.camPos.z - traj.camLook.z;
    const orbitAngle = Math.sin(t * 0.34) * 0.08 * orbitWeight;
    const cosA = Math.cos(orbitAngle);
    const sinA = Math.sin(orbitAngle);
    const orbitedX = traj.camLook.x + dx * cosA - dz * sinA;
    const orbitedZ = traj.camLook.z + dx * sinA + dz * cosA;
    const orbitLiftY = Math.cos(t * 0.28) * 0.06 * orbitWeight;

    simCamPos.set(
      orbitedX + breathX + shakeX,
      traj.camPos.y + breathY + shakeY + orbitLiftY,
      orbitedZ,
    );
    simCamLook.copy(traj.camLook);

    // Smoothly blend camera toward GRAIL 14 s simulation when settled on beat 12 (yields instantly on scroll)
    if (grailSimState.active && grailSimState.camBlend > 0.001) {
      const scrollMask = 1 - smoothstep(0.04, 0.14, Math.abs(p - 12));
      const blend = grailSimState.camBlend * scrollMask;
      if (blend > 0.001) {
        simCamPos.lerp(grailSimState.camPos, blend);
        simCamLook.lerp(grailSimState.camLook, blend);
      }
    }

    camera.position.copy(simCamPos);
    camera.lookAt(simCamLook);

    if (rocketRef.current) {
      rocketRef.current.position.copy(traj.rocketPos);
      rocketRef.current.rotation.copy(traj.rocketRot);
      rocketRef.current.scale.setScalar(traj.rocketScale);
      rocketRef.current.visible = p < 20.8 || p > 22.7;
    }

    // Dim global background lights by 60% when ExhibitPanel is open (PLAN §4)
    // AG-9a: Per-hall shadow-casting sun & tightly fitted shadow frustum
    const dim = activeExhibit ? 0.4 : 1.0;
    const orbitalT = smoothstep(2.05, 3.45, p);
    const inMoonHall = p >= 7.34 && p <= 12.45;
    const inMarsHall = p >= 13.34 && p <= 20.45;
    const inAnyExhibit = inMoonHall || inMarsHall;

    const nearestIdx = Math.max(0, Math.min(beats.length - 1, Math.round(p)));
    const nearestSlug = beats[nearestIdx]?.exhibitSlug;
    const exhibitAnchor = nearestSlug ? EXHIBIT_PLINTH_ANCHORS[nearestSlug] : undefined;

    // Smooth mid-beat transition veil between adjacent exhibit horizons (0 opacity everywhere else)
    if (veilRef.current) {
      const inMoonSwap = p >= 8.05 && p <= 11.95;
      const inMarsSwap = p >= 14.05 && p <= 19.95;
      if (!reducedMotion && (inMoonSwap || inMarsSwap)) {
        const frac = p - Math.floor(p);
        const distMid = Math.abs(frac - 0.5);
        const veilAlpha = distMid < 0.09 ? Math.pow(1 - distMid / 0.09, 1.35) * 0.94 : 0;
        veilRef.current.style.opacity = veilAlpha.toFixed(3);
        if (veilAlpha > 0.01) {
          veilRef.current.style.backgroundColor = inMoonSwap ? "rgb(4, 6, 11)" : "rgb(154, 94, 58)";
        }
      } else if (veilRef.current.style.opacity !== "0") {
        veilRef.current.style.opacity = "0";
      }
    }

    if (sunRef.current) {
      const targetMode: "pad" | "exhibit" = inAnyExhibit ? "exhibit" : "pad";
      if (shadowModeRef.current !== targetMode) {
        shadowModeRef.current = targetMode;
        const sc = sunRef.current.shadow.camera;
        if (targetMode === "exhibit") {
          sc.left = -9.5;
          sc.right = 9.5;
          sc.top = 9.5;
          sc.bottom = -9.5;
          sc.near = 1;
          sc.far = 42;
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

      if (inAnyExhibit && exhibitAnchor) {
        const [ax, ay, az] = exhibitAnchor.pos;
        sunTarget.position.set(ax, ay + 0.35, az);
        sunTarget.updateMatrixWorld();
        if (inMoonHall) {
          // One hard crisp low white lunar sun -> long sharp Apollo/Surveyor/GRAIL shadows
          sunRef.current.position.set(ax - 8.8, ay + 3.1, az + 5.2);
          sunRef.current.color.copy(moonSunColor);
          sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, 4.6 * dim, 8, dt);
        } else {
          // Warm low Martian sun across all 7 Mars landscapes
          const stormT = smoothstep(16.3, 16.85, p) * (1 - smoothstep(17.15, 17.7, p));
          sunRef.current.position.set(ax - 8.4, ay + 3.25, az + 5.4);
          sunRef.current.color.copy(marsSunColor);
          const marsIntensity = THREE.MathUtils.lerp(3.85, 2.75, stormT) * dim;
          sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, marsIntensity, 8, dt);
        }
        sunRef.current.castShadow = useShadows;
      } else {
        sunTarget.position.set(0, 4, 0);
        sunTarget.updateMatrixWorld();
        sunRef.current.position.set(
          THREE.MathUtils.lerp(-58, 65, orbitalT),
          THREE.MathUtils.lerp(15, 95, orbitalT),
          THREE.MathUtils.lerp(-22, 85, orbitalT),
        );
        sunRef.current.color.copy(duskSunColor).lerp(orbitalSunColor, orbitalT);
        const targetSun = THREE.MathUtils.lerp(3.65, 3.1, orbitalT) * dim;
        sunRef.current.intensity = THREE.MathUtils.damp(sunRef.current.intensity, targetSun, 6, dt);
        sunRef.current.castShadow = useShadows && p < 3.0;
      }
    }
    if (rimRef.current) {
      if (inMoonHall) {
        // Near-black lunar sky -> disable secondary rim fill so shadows stay sharp
        rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, 0.14 * dim, 8, dt);
      } else {
        rimRef.current.color.copy(duskRimColor).lerp(orbitalRimColor, orbitalT);
        const targetRim = (inMarsHall ? 0.55 : THREE.MathUtils.lerp(1.05, 0.85, orbitalT)) * dim;
        rimRef.current.intensity = THREE.MathUtils.damp(rimRef.current.intensity, targetRim, 6, dt);
      }
    }
    if (ambRef.current) {
      if (inMoonHall) {
        ambRef.current.color.copy(moonAmbColor);
        ambRef.current.intensity = THREE.MathUtils.damp(ambRef.current.intensity, 0.14 * dim, 8, dt);
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
        hemiRef.current.intensity = THREE.MathUtils.damp(hemiRef.current.intensity, 0.18 * dim, 8, dt);
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
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight ref={rimRef} position={[48, 22, -45]} color="#5280EA" intensity={1.05} />
    </>
  );
}

/**
 * AG-5: Pre-compiles and warms up all scene materials & shaders once mounted and after
 * lazy GLB preload so fast scrolling across transitions (6->7, 12->13->14, 22->23) has zero stutter.
 */
function MaterialPrewarmer() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const warmedRef = useRef({ moon: false, mars: false });

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      gl.compile(scene, camera);
    }, 350);
    const t2 = window.setTimeout(() => {
      gl.compile(scene, camera);
    }, 1800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [gl, scene, camera]);

  // Precompile terrain/exhibit shaders during Moon & Mars orbital approach before descent begins
  useFrame(() => {
    const p = scrollState.current;
    if (!warmedRef.current.moon && p >= 6.4 && p < 7.2) {
      warmedRef.current.moon = true;
      gl.compile(scene, camera);
    } else if (!warmedRef.current.mars && p >= 12.4 && p < 13.2) {
      warmedRef.current.mars = true;
      gl.compile(scene, camera);
    }
  });

  return null;
}

export default function SpaceScene() {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const budget = usePerfBudget();
  const rocketRef = useRef<THREE.Group | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
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
        <SceneChoreographer rocketRef={rocketRef} veilRef={veilRef} reducedMotion={reducedMotion} />
        <Suspense fallback={null}>
          <HallEnvironment />
          <CelestialWorlds reducedMotion={reducedMotion} />
          <LaunchComplex />
          <SLSRocket rocketRef={rocketRef} reducedMotion={reducedMotion} />
          <ExhibitStage3D reducedMotion={reducedMotion} />
          <ExpeditionEffects reducedMotion={reducedMotion} />
          <PostEffects />
          <MaterialPrewarmer />
        </Suspense>
      </Canvas>
      <div
        ref={veilRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-0 transition-none"
      />
    </div>
  );
}
