"use client";

import { useSyncExternalStore } from "react";
import type * as THREE from "three";

export type PerfTier = "high" | "medium" | "low";

export type PerfBudget = {
  tier: PerfTier;
  dpr: [number, number];
  starCount: number;
  steamCount: number;
  sparkCount: number;
  pyroCount: number;
  dioramaDustCount: number;
  sphereSegments: [number, number];
  glbMountWindow: number;
};

const BUDGETS: Record<PerfTier, PerfBudget> = {
  high: {
    tier: "high",
    dpr: [1, 1.5],
    starCount: 1100,
    steamCount: 140,
    sparkCount: 260,
    pyroCount: 120,
    dioramaDustCount: 46,
    sphereSegments: [72, 56],
    glbMountWindow: 3.2,
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.25],
    starCount: 640,
    steamCount: 88,
    sparkCount: 160,
    pyroCount: 76,
    dioramaDustCount: 28,
    sphereSegments: [56, 42],
    glbMountWindow: 2.4,
  },
  low: {
    tier: "low",
    dpr: [1, 1],
    starCount: 320,
    steamCount: 48,
    sparkCount: 84,
    pyroCount: 42,
    dioramaDustCount: 14,
    sphereSegments: [40, 30],
    glbMountWindow: 1.8,
  },
};

let currentTier: PerfTier = "high";
let initialized = false;
const listeners = new Set<() => void>();

function setPerfTier(next: PerfTier) {
  if (currentTier === next) return;
  currentTier = next;
  listeners.forEach((fn) => fn());
}

/** Detect initial tier from hardwareConcurrency, viewport size, and WebGL renderer string. */
export function detectInitialPerfTier(gl?: THREE.WebGLRenderer): PerfTier {
  if (typeof window === "undefined") return "high";

  const cores = navigator.hardwareConcurrency ?? 8;
  const width = window.innerWidth || 1440;
  let rendererStr = "";

  if (gl) {
    try {
      const ctx = gl.getContext();
      const dbg = ctx.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        rendererStr = String(ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || "").toLowerCase();
      }
    } catch {
      // Ignore WebGL debug extension errors
    }
  }

  const isSoftwareOrLowGpu =
    /swiftshader|llvmpipe|software|intel\(r\) hd graphics [456]|mali-4|adreno \(tm\) [345]/i.test(rendererStr);
  const isIntegratedOrMobile =
    /intel\(r\) iris|intel\(r\) uhd|apple a1[234]|adreno|mali/i.test(rendererStr) || width < 768;

  let detected: PerfTier = "high";
  if (isSoftwareOrLowGpu || cores <= 4) {
    detected = "low";
  } else if (isIntegratedOrMobile || cores <= 6) {
    detected = "medium";
  }

  if (!initialized || gl) {
    initialized = true;
    setPerfTier(detected);
  }
  return currentTier;
}

// First-2-second live FPS monitor to step down tier automatically if frame rate drops
let sampleElapsed = 0;
let sampleFrames = 0;
let monitorDone = false;

export function updatePerfFpsMonitor(delta: number) {
  if (monitorDone || delta <= 0 || delta > 0.25) return;
  sampleElapsed += delta;
  sampleFrames += 1;

  if (sampleElapsed >= 2.0) {
    monitorDone = true;
    const avgFps = sampleFrames / sampleElapsed;
    if (avgFps < 34) {
      setPerfTier("low");
    } else if (avgFps < 50 && currentTier === "high") {
      setPerfTier("medium");
    }
  }
}

export function getPerfBudget(): PerfBudget {
  if (!initialized && typeof window !== "undefined") {
    detectInitialPerfTier();
  }
  return BUDGETS[currentTier];
}

export function usePerfBudget(): PerfBudget {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => BUDGETS[currentTier],
    () => BUDGETS.high,
  );
}
