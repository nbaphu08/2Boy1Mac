"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { type BloomEffect, type DepthOfFieldEffect, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { scrollState, smoothstep } from "@/lib/scroll/progress";
import { usePerfBudget } from "./perfTier";
import { grailSimState } from "./simulationBus";
import { sampleTrajectory } from "./trajectory";

export type HallEnv = "launch" | "deep" | "moon" | "mars";

export function resolveHallEnv(p: number): HallEnv {
  if (p < 2.65) return "launch";
  if ((p >= 7.45 && p < 13.35) || p >= 22.3) return "moon";
  if (p >= 13.35 && p < 20.4) return "mars";
  return "deep";
}

/**
 * Single invariant 128px PMREM Environment baked ONCE at load (never unmounted or key-swapped
 * mid-scroll, preventing full-scene shader recompiles), with `scene.environmentIntensity`
 * smoothly attenuated per hall in `useFrame` (e.g. crisp ~0.09 airless dark fill on Moon).
 */
export function HallEnvironment() {
  const envIntensityRef = useRef(0.92);

  useFrame((state, delta) => {
    const p = scrollState.current;
    const moonMask =
      smoothstep(7.2, 7.6, p) * (1 - smoothstep(12.2, 12.6, p)) +
      smoothstep(22.15, 22.65, p);
    const marsMask = smoothstep(13.2, 13.55, p) * (1 - smoothstep(20.1, 20.5, p));
    const clampedMoon = Math.min(1, moonMask);
    const targetIntensity = THREE.MathUtils.lerp(
      THREE.MathUtils.lerp(0.92, 0.82, marsMask),
      0.09,
      clampedMoon,
    );
    envIntensityRef.current = THREE.MathUtils.damp(
      envIntensityRef.current,
      targetIntensity,
      8,
      Math.min(delta, 0.05),
    );
    const activeScene = state.scene;
    if (activeScene.environmentIntensity !== envIntensityRef.current) {
      activeScene.environmentIntensity = envIntensityRef.current;
    }
  });

  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.92}>
      <color attach="background" args={["#060B18"]} />
      <Lightformer
        form="circle"
        intensity={6.6}
        color="#FFF9EC"
        position={[18, 12, 14]}
        scale={[10, 10, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#5B88E8"
        position={[-18, 7, -14]}
        scale={[24, 16, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.75}
        color="#A8C4FF"
        position={[0, 22, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[28, 12, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.15}
        color="#8F5838"
        position={[0, -14, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[30, 30, 1]}
      />
    </Environment>
  );
}

/**
 * Tier-aware HDR post-processing pipeline:
 * - high: N8AO + DepthOfField (focused on resting exhibit) + selective HDR Bloom + ACES ToneMapping + SMAA
 * - medium: light halfRes N8AO + selective HDR Bloom + ACES ToneMapping + SMAA
 * - low: bypassed cleanly (Canvas ACESFilmicToneMapping handles output) to preserve >= 30 fps
 */
export function PostEffects() {
  const budget = usePerfBudget();
  const dofRef = useRef<DepthOfFieldEffect>(null);
  const bloomRef = useRef<BloomEffect>(null);
  const trajTmp = useMemo(
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
    const p = scrollState.current;
    // Moon Apollo optics & airless vacuum: mute bloom haze on lunar surface beats 8..12 (AG-12b)
    if (bloomRef.current) {
      const inMoon = smoothstep(7.55, 7.9, p) * (1 - smoothstep(12.1, 12.5, p));
      const baseBloom = budget.tier === "medium" ? 0.44 : 0.58;
      bloomRef.current.intensity = THREE.MathUtils.lerp(baseBloom, 0.02, inMoon);
    }

    if (budget.tier !== "high" || !dofRef.current) return;
    // Moon Apollo Hasselblad optics keep distant Mount Hadley / massifs razor-sharp (AG-12)
    const inMars = smoothstep(13.65, 14.0, p) * (1 - smoothstep(20.05, 20.45, p));
    const isResting = 1 - smoothstep(0.08, 0.45, Math.abs(scrollState.velocity));
    const simMute = grailSimState.active ? 1 - grailSimState.camBlend : 1;
    const targetBokeh = inMars * isResting * simMute * 1.35;

    dofRef.current.bokehScale = THREE.MathUtils.damp(
      dofRef.current.bokehScale,
      targetBokeh,
      7,
      Math.min(delta, 0.05),
    );

    if (targetBokeh > 0.02 || dofRef.current.bokehScale > 0.02) {
      sampleTrajectory(p, trajTmp);
      if (dofRef.current.target) {
        dofRef.current.target.copy(trajTmp.camLook);
      }
    }
  });

  if (budget.tier === "low") {
    return null;
  }

  if (budget.tier === "medium") {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false} frameBufferType={THREE.HalfFloatType}>
        <N8AO
          halfRes
          quality="low"
          aoRadius={0.85}
          distanceFalloff={1.0}
          intensity={1.35}
          color="#03050A"
        />
        <Bloom
          ref={bloomRef}
          mipmapBlur
          luminanceThreshold={1.08}
          luminanceSmoothing={0.22}
          intensity={0.44}
          radius={0.62}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.34} darkness={0.28} />
        <SMAA />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass={false} frameBufferType={THREE.HalfFloatType}>
      <N8AO
        halfRes
        depthAwareUpsampling
        quality="medium"
        aoRadius={0.65}
        distanceFalloff={1.0}
        intensity={2.05}
        color="#03050A"
      />
      <DepthOfField
        ref={dofRef}
        target={[0, 0, 0]}
        worldFocusRange={8.5}
        focalLength={0.025}
        bokehScale={0}
        resolutionScale={0.5}
      />
      <Bloom
        ref={bloomRef}
        mipmapBlur
        luminanceThreshold={1.08}
        luminanceSmoothing={0.22}
        intensity={0.58}
        radius={0.65}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.34} darkness={0.28} />
      <SMAA />
    </EffectComposer>
  );
}
