"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  ToneMapping,
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
 * Per-hall HDR Image-Based Lighting built solely from drei <Lightformer>s (zero external HDRI).
 * Re-bakes once at 128px resolution only when crossing a hall threshold.
 */
export function HallEnvironment() {
  const [hall, setHall] = useState<HallEnv>(() => resolveHallEnv(scrollState.current));
  const hallRef = useRef<HallEnv>(hall);

  useFrame(() => {
    const next = resolveHallEnv(scrollState.current);
    if (next !== hallRef.current) {
      hallRef.current = next;
      setHall(next);
    }
  });

  if (hall === "moon") {
    // Hard single white solar key + pitch-black lunar sky + minimal regolith underside bounce
    return (
      <Environment key="moon" resolution={128} frames={1} environmentIntensity={0.09}>
        <color attach="background" args={["#000000"]} />
        <Lightformer
          form="circle"
          intensity={6.5}
          color="#FFFDF5"
          position={[18, 6, 8]}
          scale={[4.0, 4.0, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.08}
          color="#7A746C"
          position={[0, -12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[30, 30, 1]}
        />
      </Environment>
    );
  }

  if (hall === "mars") {
    // Warm dusty butterscotch sky hemisphere + low warm sun + warm ochre soil bounce
    return (
      <Environment key="mars" resolution={128} frames={1} environmentIntensity={0.86}>
        <color attach="background" args={["#4A2616"]} />
        <Lightformer
          form="circle"
          intensity={5.4}
          color="#FFD6AC"
          position={[-16, 10, 14]}
          scale={[9, 9, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={2.2}
          color="#C98354"
          position={[0, 14, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[26, 26, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.55}
          color="#9A4E2D"
          position={[0, -12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[34, 34, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#D4956A"
          position={[16, 5, -14]}
          scale={[18, 10, 1]}
          target={[0, 0, 0]}
        />
      </Environment>
    );
  }

  if (hall === "launch") {
    // 6:35 p.m. EDT KSC sunset glow from west + deep twilight sky + Atlantic/pad reflection
    return (
      <Environment key="launch" resolution={128} frames={1} environmentIntensity={0.95}>
        <color attach="background" args={["#0A152C"]} />
        <Lightformer
          form="circle"
          intensity={6.2}
          color="#FF9E58"
          position={[-20, 5, -8]}
          scale={[14, 10, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={2.1}
          color="#4672CC"
          position={[0, 18, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[34, 34, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#DCE6FF"
          position={[14, 6, 16]}
          scale={[12, 8, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.35}
          color="#D8763C"
          position={[0, -12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[28, 28, 1]}
        />
      </Environment>
    );
  }

  // Deep space / orbital ascent / Hall of Silence / Beyond
  return (
    <Environment key="deep" resolution={128} frames={1} environmentIntensity={0.92}>
      <color attach="background" args={["#040710"]} />
      <Lightformer
        form="circle"
        intensity={6.8}
        color="#FFFFFF"
        position={[18, 18, 16]}
        scale={[8, 8, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#5B88E8"
        position={[-18, 6, -16]}
        scale={[24, 16, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.8}
        color="#A8C4FF"
        position={[0, 22, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[26, 8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#2E5698"
        position={[0, -16, 6]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[24, 24, 1]}
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
      <SMAA />
    </EffectComposer>
  );
}
