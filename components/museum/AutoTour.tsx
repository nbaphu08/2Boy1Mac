"use client";

import { useEffect, useState } from "react";
import { expedition } from "@/content/guide";
import { pauseTour, toggleTour, useTourStatus } from "@/lib/autoTour";

const t = expedition.autoTour;
const HINT_KEY = "spacemuse:autotour-hint";

function Icon({ status }: { status: ReturnType<typeof useTourStatus> }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden fill="currentColor">
      {status === "running" ? (
        <>
          <rect x="1.5" y="1" width="2.5" height="8" />
          <rect x="6" y="1" width="2.5" height="8" />
        </>
      ) : status === "ended" ? (
        <path d="M1 5.5l2.5 2.5L9 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      ) : (
        <path d="M2 1l7 4-7 4z" />
      )}
    </svg>
  );
}

function labelFor(status: ReturnType<typeof useTourStatus>) {
  return status === "running" ? t.pause : status === "paused" ? t.resume : status === "ended" ? t.ended : t.start;
}

/** Auto tour toggle: `bar` sits in the desktop HUD, `pill` is the mobile floating pill (left of the MAP pill). */
export function AutoTourButton({ variant }: { variant: "bar" | "pill" }) {
  const status = useTourStatus();
  const on = status === "running";
  const label = labelFor(status);
  const common = {
    type: "button" as const,
    onClick: () => {
      try {
        localStorage.setItem(HINT_KEY, "1");
      } catch {
        /* ignore */
      }
      toggleTour();
    },
    "aria-pressed": on,
    "aria-label": label,
    title: label,
    "data-autotour": "",
  };
  if (variant === "bar") {
    return (
      <button
        {...common}
        className={`font-hud hidden cursor-pointer items-center gap-1.5 text-[10px] transition-colors hover:text-text sm:flex ${on ? "text-starlight" : "text-mute"}`}
      >
        <Icon status={status} />
        <span>{status === "running" || status === "paused" ? label : status === "ended" ? t.ended : t.start}</span>
      </button>
    );
  }
  return (
    <button
      {...common}
      className={`font-hud pointer-events-auto fixed bottom-1.5 right-[5.25rem] z-20 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border bg-surface/80 px-3 text-[10px] backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-starlight sm:hidden ${on ? "border-starlight/60 text-starlight" : "border-line/80 text-platinum"}`}
    >
      <Icon status={status} />
      <span>{label}</span>
    </button>
  );
}

/** Mounts the one-time hint toast. The engine itself lives in lib/autoTour.ts. */
export function AutoTourController() {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) return;
    const show = window.setTimeout(() => setHint(true), 1200);
    return () => window.clearTimeout(show);
  }, []);

  useEffect(() => {
    if (!hint) return;
    const hide = window.setTimeout(() => dismiss(), 10000);
    return () => window.clearTimeout(hide);
  }, [hint]);

  useEffect(() => () => pauseTour(), []);

  function dismiss() {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  if (!hint) return null;
  return (
    <div
      role="status"
      data-autotour-hint=""
      className="font-hud pointer-events-auto fixed bottom-16 right-3 z-30 flex w-60 items-start gap-2 rounded-xl border border-starlight/40 bg-surface/90 px-3 py-2 text-[10px] leading-snug text-platinum backdrop-blur-md sm:bottom-auto sm:right-10 sm:top-16 sm:w-72"
    >
      <span className="flex-1">{t.hint}</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="cursor-pointer text-mute hover:text-text">
        &times;
      </button>
    </div>
  );
}
