// Shared audio-guide engine: ONE HTMLAudioElement for the whole site (only one audio at a time).
// unlockAudio() is called synchronously from the click/key that opens an exhibit so iOS/Safari
// lets us start playback later from a timer.
const PREF_KEY = "spacemuse:audio";
// 0.1 s of silence.
const SILENT =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

let el: HTMLAudioElement | null = null;
let unlocked = false;
const pausedSlugs = new Set<string>();

export function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio();
    el.preload = "none";
  }
  return el;
}

export function unlockAudio() {
  const a = getAudio();
  if (!a || unlocked) return;
  try {
    a.src = SILENT;
    const p = a.play();
    unlocked = true;
    if (p && typeof p.then === "function") {
      p.then(() => {
        if (a.src === SILENT) a.pause();
      }).catch(() => {
        unlocked = false;
      });
    }
  } catch {
    /* ignore */
  }
}

export function stopAudio() {
  const a = el;
  if (!a) return;
  a.pause();
  try {
    a.currentTime = 0;
  } catch {
    /* ignore */
  }
}

export function markUserPaused(slug: string) {
  pausedSlugs.add(slug);
}
export function wasUserPaused(slug: string) {
  return pausedSlugs.has(slug);
}
export function endAudioSession() {
  pausedSlugs.clear();
  stopAudio();
}

// Preference (default on), persisted.
const listeners = new Set<() => void>();
export function getAudioPref(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}
export function setAudioPref(on: boolean) {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}
export function subscribeAudioPref(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// Build-time manifest of which narration files exist (exhibit clips + audio-tour clips).
type Manifest = { slugs: string[]; tour: string[] };
let manifestP: Promise<Manifest> | null = null;
export function audioManifest(): Promise<Manifest> {
  manifestP ??= fetch("/audio-manifest.json")
    .then((r) => (r.ok ? r.json() : { slugs: [], tour: [] }))
    .then((j) => ({
      slugs: Array.isArray(j.slugs) ? (j.slugs as string[]) : [],
      tour: Array.isArray(j.tour) ? (j.tour as string[]) : [],
    }))
    .catch(() => {
      manifestP = null;
      return { slugs: [], tour: [] } as Manifest;
    });
  return manifestP;
}

// Probe registered by the audio-tour controller: seconds left in the clip speaking for `beatId`, or null.
let clipProbe: ((beatId: string) => number | null) | null = null;
export function setClipProbe(fn: ((beatId: string) => number | null) | null) {
  clipProbe = fn;
}
export function clipRemaining(beatId: string): number | null {
  return clipProbe ? clipProbe(beatId) : null;
}
