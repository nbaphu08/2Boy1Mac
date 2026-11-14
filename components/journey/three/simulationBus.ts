import * as THREE from "three";

export type GrailSimPhase = "idle" | "mapping" | "descent" | "impact" | "rest";

export type GrailSimRuntime = {
  /** True while the GRAIL simulation owns camera blending during beat 12 playback. */
  active: boolean;
  /** Elapsed simulation time in seconds within [0, 14]. */
  elapsed: number;
  /** 0 = Catmull-Rom / resting orbit, 1 = simulation camera rig. */
  camBlend: number;
  phase: GrailSimPhase;
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
};

export const grailSimState: GrailSimRuntime = {
  active: false,
  elapsed: 0,
  camBlend: 0,
  phase: "idle",
  camPos: new THREE.Vector3(2.85, 372.65, -180.8),
  camLook: new THREE.Vector3(0.85, 371.55, -188.2),
};

const replayListeners = new Set<() => void>();

/**
 * Trigger a full ~14 s replay of the GRAIL Ebb & Flow mapping-to-impact simulation on beat 12.
 * Can be called from DOM overlay buttons or dev tools.
 */
export function replayGrailSim(): void {
  for (const listener of replayListeners) {
    listener();
  }
}

/**
 * Subscribe to manual GRAIL simulation replay triggers. Returns an unsubscribe callback.
 */
export function subscribeGrailReplay(listener: () => void): () => void {
  replayListeners.add(listener);
  return () => {
    replayListeners.delete(listener);
  };
}
