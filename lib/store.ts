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

export type MuseumState = {
  beatIndex: number; // Fable writes
  beatId: string;
  isTransitioning: boolean; // Fable writes
  activeExhibit: string | null; // slug
  openExhibit: (slug: string) => void;
  closeExhibit: () => void;
  visited: string[]; // passport (persisted to localStorage)
  markVisited: (slug: string) => void;
  reducedMotion: boolean;
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
  markVisited: (slug) => {
    const cur = get().visited;
    if (cur.includes(slug)) return;
    const next = [...cur, slug];
    set({ visited: next });
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  },
  reducedMotion: false,
  setBeat: (beatIndex, beatId) => set({ beatIndex, beatId }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  hydrateVisited: () => set({ visited: loadVisited() }),
}));
