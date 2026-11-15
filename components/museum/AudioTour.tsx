"use client";

import { useEffect, useSyncExternalStore } from "react";
import { beats } from "@/content/beats";
import { expedition } from "@/content/guide";
import {
  audioManifest,
  getAudio,
  getAudioPref,
  setAudioPref,
  subscribeAudioPref,
} from "@/lib/audioGuide";
import { scrollState } from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";

const t = expedition.tour;
const MIN_BEAT = 1;
const FADE_MS = 300;
const tourUrl = (id: string) => `/media/audio/tour/${id}.mp3`;

type Status = "idle" | "playing" | "blocked";
type Snap = { status: Status; clipBeat: string | null; available: boolean };

// Tiny module store so the HUD toggle, replay and "start" button share the controller's state.
let snap: Snap = { status: "idle", clipBeat: null, available: false };
const subs = new Set<() => void>();
const setSnap = (p: Partial<Snap>) => {
  snap = { ...snap, ...p };
  subs.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  subs.add(l);
  return () => {
    subs.delete(l);
  };
};
const getSnap = () => snap;
const serverSnap: Snap = { status: "idle", clipBeat: null, available: false };

const played = new Set<string>(); // beats whose clip already played this visit
let tourBeats: Set<string> = new Set();
let fadeTimer = 0;
let current: string | null = null; // beat id of the clip loaded in the shared element

const isTour = (a: HTMLAudioElement) => a.getAttribute("src")?.startsWith("/media/audio/tour/") ?? false;

function hardStop(a: HTMLAudioElement) {
  window.clearInterval(fadeTimer);
  if (isTour(a)) {
    a.pause();
    try {
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
    a.volume = 1;
  }
  current = null;
  setSnap({ status: "idle", clipBeat: null });
}

function fadeOut(a: HTMLAudioElement) {
  if (!isTour(a) || a.paused) return hardStop(a);
  window.clearInterval(fadeTimer);
  const t0 = performance.now();
  const v0 = a.volume;
  current = null;
  fadeTimer = window.setInterval(() => {
    const k = Math.min(1, (performance.now() - t0) / FADE_MS);
    a.volume = Math.max(0, v0 * (1 - k));
    if (k >= 1) hardStop(a);
  }, 30);
}

/** Start a beat's clip. Safe to call synchronously from a user gesture. */
function playBeat(id: string) {
  const a = getAudio();
  if (!a || !tourBeats.has(id)) return;
  window.clearInterval(fadeTimer);
  a.volume = 1;
  a.src = tourUrl(id);
  current = id;
  played.add(id);
  setSnap({ clipBeat: id });
  a.play().then(
    () => setSnap({ status: "playing" }),
    () => {
      if (current === id) setSnap({ status: "blocked" });
    },
  );
}

export function AudioTourController() {
  const pref = useSyncExternalStore(subscribeAudioPref, getAudioPref, () => true);

  useEffect(() => {
    const a = getAudio();
    if (!a) return;
    let dead = false;
    let pos = scrollState.target;
    let lastMove = performance.now();
    let hiddenPaused = false;

    audioManifest().then((m) => {
      if (dead) return;
      tourBeats = new Set(m.tour);
      setSnap({ available: m.tour.length > 0 });
    });

    const onPlay = () => isTour(a) && setSnap({ status: "playing" });
    const onPause = () => {
      if (isTour(a) && !a.ended && !hiddenPaused && snap.status === "playing") setSnap({ status: "idle" });
    };
    const onEnded = () => {
      if (isTour(a)) {
        current = null;
        setSnap({ status: "idle" });
      }
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnded);

    const onVis = () => {
      if (document.hidden) {
        if (isTour(a) && !a.paused) {
          hiddenPaused = true;
          a.pause();
        }
      } else if (hiddenPaused) {
        hiddenPaused = false;
        if (isTour(a) && !a.ended && current) a.play().catch(() => setSnap({ status: "blocked" }));
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = () => {
      if (document.hidden) return;
      const st = useMuseum.getState();
      const p = scrollState.target;
      if (Math.abs(p - pos) > 0.002) lastMove = performance.now();
      pos = p;
      const nearest = Math.max(MIN_BEAT, Math.min(beats.length - 1, Math.round(p)));
      const off = Math.abs(p - nearest);
      const id = beats[nearest].id;

      // Exhibit panel open: its own audio guide takes over; never replay this beat's clip afterwards.
      if (st.activeExhibit !== null) {
        played.add(id);
        if (isTour(a)) hardStop(a);
        return;
      }
      if (!getAudioPref()) {
        if (isTour(a)) hardStop(a);
        return;
      }
      // Scrolled away from the clip's beat: fade out.
      if (current && isTour(a)) {
        const ci = beats.findIndex((b) => b.id === current);
        if (ci >= 0 && Math.abs(p - ci) > 0.15) fadeOut(a);
      }
      // Settled on a new beat: start its clip (once per visit).
      const tol = st.reducedMotion || st.lightweight || st.webglFailed ? 0.25 : 0.03;
      const settled = off < tol && performance.now() - lastMove > 300;
      if (settled && !played.has(id) && tourBeats.has(id) && snap.status !== "blocked" && current !== id) {
        // Another (non-tour) clip, e.g. an exhibit guide, owns the element: leave it alone.
        if (!a.paused && !isTour(a)) return;
        playBeat(id);
      }
    };
    const iv = window.setInterval(tick, 100);

    return () => {
      dead = true;
      window.clearInterval(iv);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnded);
      document.removeEventListener("visibilitychange", onVis);
      hardStop(a);
    };
  }, []);

  // Turning the preference back on lets the current beat speak again.
  useEffect(() => {
    if (pref) {
      const i = Math.max(MIN_BEAT, Math.min(beats.length - 1, Math.round(scrollState.target)));
      played.delete(beats[i].id);
    }
  }, [pref]);

  return <StartButton />;
}

function StartButton() {
  const s = useSyncExternalStore(subscribe, getSnap, () => serverSnap);
  if (s.status !== "blocked" || !s.clipBeat) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const i = Math.max(MIN_BEAT, Math.min(beats.length - 1, Math.round(scrollState.target)));
        playBeat(beats[i].id);
      }}
      className="font-hud fixed bottom-16 left-1/2 z-40 -translate-x-1/2 cursor-pointer rounded-full border border-starlight/60 bg-surface/80 px-4 py-2 text-[11px] text-starlight backdrop-blur-md transition-colors hover:bg-starlight hover:text-void focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-starlight sm:bottom-8"
    >
      {t.start}
    </button>
  );
}

const BAR_DELAYS = ["0ms", "160ms", "80ms"];

/** Compact speaker toggle (same on/off preference as the exhibit audio guide) + replay. */
export function AudioTourToggle() {
  const pref = useSyncExternalStore(subscribeAudioPref, getAudioPref, () => true);
  const s = useSyncExternalStore(subscribe, getSnap, () => serverSnap);
  const beatId = useMuseum((m) => m.beatId);
  const speaking = pref && s.status === "playing";
  const canReplay = pref && s.status !== "playing" && tourBeats.has(beatId) && beatId !== "hero";
  return (
    <>
      {canReplay ? (
        <button
          type="button"
          onClick={() => playBeat(beatId)}
          aria-label={t.replay}
          title={t.replay}
          className="grid h-6 w-6 cursor-pointer place-items-center text-mute transition-colors hover:text-text"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 8a5 5 0 1 0 1.8-3.8M3 2v3h3" />
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setAudioPref(!pref)}
        aria-label={pref ? t.on : t.off}
        title={pref ? t.on : t.off}
        className={`flex h-6 w-7 cursor-pointer items-center justify-center gap-[2px] transition-colors hover:text-text ${pref ? "text-starlight" : "text-mute"}`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="currentColor">
          <path d="M2 6h3l4-3.5v11L5 10H2z" />
          {pref ? null : <path d="M11 5.5l4 5M15 5.5l-4 5" stroke="currentColor" strokeWidth="1.4" fill="none" />}
        </svg>
        {speaking ? (
          <span aria-hidden className="flex h-3 items-end gap-[2px]">
            {BAR_DELAYS.map((d) => (
              <span
                key={d}
                className="block w-[2px] rounded-full bg-current motion-safe:animate-[tour-level_700ms_ease-in-out_infinite_alternate] motion-reduce:h-2"
                style={{ animationDelay: d, height: "40%" }}
              />
            ))}
          </span>
        ) : null}
      </button>
    </>
  );
}
