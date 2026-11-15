"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { expedition } from "@/content/guide";
import {
  audioManifest,
  getAudio,
  getAudioPref,
  markUserPaused,
  setAudioPref,
  stopAudio,
  subscribeAudioPref,
  wasUserPaused,
} from "@/lib/audioGuide";

type Phase = "checking" | "missing" | "countdown" | "ready" | "playing" | "paused" | "blocked";

const DELAY_MS = 2000;
const t = expedition.audio;

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function AudioGuide({ slug, auto }: { slug: string; auto: boolean }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const pref = useSyncExternalStore(subscribeAudioPref, getAudioPref, () => true);
  const prefRef = useRef(pref);
  const phaseRef = useRef<Phase>("checking");
  const timer = useRef<number | null>(null);
  const url = `/media/audio/${slug}.mp3`;

  useEffect(() => {
    prefRef.current = pref;
  }, [pref]);

  const set = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  useEffect(() => {
    const a = getAudio();
    if (!a) return;
    let dead = false;

    const clearTimer = () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const start = () => {
      a.play().then(
        () => !dead && set("playing"),
        () => !dead && set("blocked"),
      );
    };

    const mine = () => a.getAttribute("src") === url;
    const onTime = () => mine() && setTime(a.currentTime);
    const onMeta = () => mine() && setDur(a.duration);
    const onEnded = () => {
      if (!mine()) return;
      set("ready");
      setTime(0);
    };
    const onPause = () => {
      if (mine() && !a.ended && phaseRef.current === "playing") set("paused");
    };
    const onPlay = () => mine() && phaseRef.current !== "playing" && set("playing");
    const onError = () => {
      if (a.getAttribute("src") === url) set("missing");
    };
    const onVis = () => {
      if (document.hidden && !a.paused) a.pause();
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended", onEnded);
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    a.addEventListener("error", onError);
    document.addEventListener("visibilitychange", onVis);

    // Make sure nothing from a previous exhibit keeps playing.
    stopAudio();
    audioManifest()
      .then(({ slugs }) => {
        if (dead) return;
        if (!slugs.includes(slug)) return set("missing");
        a.src = url;
        a.load();
        if (auto && prefRef.current && !wasUserPaused(slug)) {
          set("countdown");
          timer.current = window.setTimeout(start, DELAY_MS);
        } else {
          set("ready");
        }
      })
      .catch(() => !dead && set("missing"));

    return () => {
      dead = true;
      clearTimer();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("error", onError);
      document.removeEventListener("visibilitychange", onVis);
      stopAudio();
    };
  }, [slug, auto, url]);

  if (phase === "missing" || phase === "checking") return null;

  const playing = phase === "playing";
  const toggle = () => {
    const a = getAudio();
    if (!a) return;
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (playing) {
      markUserPaused(slug);
      a.pause();
    } else {
      a.play().then(
        () => set("playing"),
        () => set("blocked"),
      );
    }
  };
  const togglePref = () => {
    const next = !pref;
    setAudioPref(next);
    if (!next) {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
        set("ready");
      }
    }
  };
  const pct = dur > 0 ? Math.min(100, (time / dur) * 100) : 0;
  const status =
    phase === "countdown" ? t.starting : phase === "blocked" ? t.tapToListen : `${fmt(time)} / ${fmt(dur)}`;

  return (
    <div role="group" aria-label={t.region} className="mt-4 flex items-center gap-3 rounded border border-line bg-raised/60 px-3 py-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t.pause : t.play}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-starlight/60 text-starlight transition-colors hover:bg-starlight hover:text-void focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-starlight"
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="currentColor">
            <rect x="3" y="2" width="3.5" height="12" />
            <rect x="9.5" y="2" width="3.5" height="12" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="currentColor">
            <path d="M4 2l10 6-10 6z" />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-hud text-[11px] text-mute">{t.label}</span>
          <span className={`font-hud text-[11px] text-text ${phase === "countdown" ? "motion-safe:animate-pulse" : ""}`} aria-live="polite">
            {status}
          </span>
        </div>
        <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={t.region}>
          <div className="h-full bg-starlight" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button
        type="button"
        onClick={togglePref}
        aria-pressed={pref}
        aria-label={t.autoHint}
        className="font-hud shrink-0 rounded border border-line px-2 py-1.5 text-[10px] text-mute hover:border-platinum hover:text-text"
      >
        {pref ? t.autoOn : t.autoOff}
      </button>
    </div>
  );
}
