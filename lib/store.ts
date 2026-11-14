import { create } from "zustand";

const KEY = "spacemuse:visited";

function loadVisited(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const KEY_AT = "spacemuse:visited-at";

function loadVisitedAt(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY_AT);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

const KEY_LW = "spacemuse:lightweight";

function loadLightweight(): boolean {
  try {
    return localStorage.getItem(KEY_LW) === "1";
  } catch {
    return false;
  }
}

export type MuseumState = {
  beatIndex: number; // Fable writes
  beatId: string;
  isTransitioning: boolean; // Fable writes
  activeExhibit: string | null; // slug
  openExhibit: (slug: string) => void;
  closeExhibit: () => void;
  visited: string[]; // passport (persisted to localStorage)
  visitedAt: Record<string, string>; // slug -> ISO date (YYYY-MM-DD)
  markVisited: (slug: string) => void;
  reducedMotion: boolean;
  lightweight: boolean; // user-forced static (poster) mode, persisted
  modeResolved: boolean; // reduced-motion / WebGL checks done (client)
  webglFailed: boolean; // WebGL unavailable / context creation failed
  setLightweight: (v: boolean) => void;
  setWebglFailed: (v: boolean) => void;
  // setters (engine / providers)
  setBeat: (index: number, id: string) => void;
  setTransitioning: (v: boolean) => void;
  setReducedMotion: (v: boolean) => void;
  hydrateVisited: () => void; // call once on the client after mount
};

export const useMuseum = create<MuseumState>((set, get) => ({
  beatIndex: 0,
  beatId: "hero",
  isTransitioning: false,
  activeExhibit: null,
  openExhibit: (slug) => {
    set({ activeExhibit: slug });
    get().markVisited(slug);
  },
  closeExhibit: () => set({ activeExhibit: null }),
  visited: [],
  visitedAt: {},
  markVisited: (slug) => {
    const cur = get().visited;
    if (cur.includes(slug)) return;
    const next = [...cur, slug];
    const at = { ...get().visitedAt, [slug]: new Date().toISOString().slice(0, 10) };
    set({ visited: next, visitedAt: at });
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.setItem(KEY_AT, JSON.stringify(at));
    } catch {}
  },
  reducedMotion: false,
  setBeat: (beatIndex, beatId) => set({ beatIndex, beatId }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  lightweight: false,
  webglFailed: false,
  modeResolved: false,
  setLightweight: (lightweight) => {
    set({ lightweight });
    try {
      localStorage.setItem(KEY_LW, lightweight ? "1" : "0");
    } catch {}
  },
  setWebglFailed: (webglFailed) => set({ webglFailed }),
  hydrateVisited: () =>
    set({ modeResolved: true, visited: loadVisited(), visitedAt: loadVisitedAt(), lightweight: loadLightweight() }),
}));
