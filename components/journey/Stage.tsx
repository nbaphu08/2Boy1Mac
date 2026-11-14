"use client";

import { useLayoutEffect, useRef } from "react";
import { beats } from "@/content/beats";
import type { Beat } from "@/content/types";
import { useMuseum } from "@/lib/store";
import { goTo, mountStepEngine } from "@/lib/step";
import { scenes } from "./acts";
import { ExhibitPanel } from "@/components/museum/ExhibitPanel";

// Rail groups: consecutive beats that share the same `rail` label.
const railGroups = beats.reduce<{ rail: Beat["rail"]; items: { beat: Beat; index: number }[] }[]>(
  (groups, beat, index) => {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.rail === beat.rail) lastGroup.items.push({ beat, index });
    else groups.push({ rail: beat.rail, items: [{ beat, index }] });
    return groups;
  },
  [],
);

const PANEL_BG = ["bg-void", "bg-surface", "bg-raised"] as const;
const accentOf = (b: Beat) =>
  b.id === "ignition"
    ? "var(--ignite)"
    : b.rail === "MOON"
      ? "var(--lunar)"
      : b.rail === "MARS"
        ? "var(--oxide)"
        : "var(--starlight)";
const pad = (n: number) => String(n).padStart(2, "0");

/** Placeholder panel. Sonnet replaces the inside with the real beat scene (keep `data-beat` on the wrapper). */
function DummyPanel({ beat, index }: { beat: Beat; index: number }) {
  return (
    <section
      data-beat={beat.id}
      className={`absolute inset-0 flex items-center ${PANEL_BG[index % 3]}`}
      style={{ visibility: index === 0 ? "visible" : "hidden", opacity: index === 0 ? 1 : 0 }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 40%, var(--void) 100%)" }}
      />
      <div data-beat-body className="relative w-full px-6 pr-16 sm:px-16 sm:pr-40">
        <p className="font-hud text-xs text-mute">
          <span style={{ color: accentOf(beat) }}>{pad(index)}</span> / {pad(beats.length - 1)} · {beat.id} · {beat.act} ·{" "}
          {beat.duration}s
        </p>
        <div className="mt-4 h-px w-24" style={{ background: accentOf(beat) }} />
        {beat.sub ? <p className="font-hud mt-6 text-sm text-platinum">{beat.sub}</p> : null}
        {beat.title ? (
          <h2
            className="font-display mt-3 text-4xl leading-tight sm:text-6xl"
            style={beat.id === "ignition" ? { color: "var(--ignite)" } : undefined}
          >
            {beat.title}
          </h2>
        ) : null}
        {beat.caption ? <p className="mt-5 max-w-2xl text-lg text-text sm:text-xl">{beat.caption}</p> : null}
      </div>
    </section>
  );
}

function ProgressRail() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  return (
    <nav
      data-step-ignore
      aria-label="Mission progress"
      className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-6"
    >
      {railGroups.map((group) => {
        const current = group.items.some((it) => it.index === beatIndex);
        return (
          <div key={group.rail} className="flex items-center gap-3">
            <span className={`font-hud hidden text-[10px] sm:block ${current ? "text-text" : "text-mute"}`}>
              {group.rail}
            </span>
            <ul className="flex flex-col items-center">
              {group.items.map(({ beat, index }) => {
                const on = index === beatIndex;
                return (
                  <li key={beat.id}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`Go to ${beat.title ?? beat.sub ?? beat.id}`}
                      aria-current={on ? "step" : undefined}
                      className="flex h-4 w-6 cursor-pointer items-center justify-center"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          on ? "h-2 w-2 bg-starlight" : index < beatIndex ? "h-1 w-1 bg-platinum" : "h-1 w-1 bg-mute"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

/** Caption for screen readers + the "Scroll" hint that appears after 3 s at rest. */
function RestHud() {
  const beatIndex = useMuseum((s) => s.beatIndex);
  const isTransitioning = useMuseum((s) => s.isTransitioning);
  const beat = beats[beatIndex];
  const isLast = beatIndex === beats.length - 1;
  return (
    <>
      <p aria-live="polite" className="sr-only">
        {isTransitioning ? "" : [beat.title, beat.caption ?? beat.sub].filter(Boolean).join(". ")}
      </p>
      {!isTransitioning && !isLast && beatIndex !== 0 ? (
        <p
          key={beatIndex}
          aria-hidden
          className="step-hint font-hud pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-xs text-mute"
        >
          Scroll ↓
        </p>
      ) : null}
    </>
  );
}

export default function Stage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const veil = veilRef.current;
    if (!stage || !veil) return;
    const panels = Array.from(stage.querySelectorAll<HTMLElement>("[data-beat]"));
    const root = document.documentElement;
    const prevOverscroll = root.style.overscrollBehavior;
    root.style.overscrollBehavior = "none";
    const unmount = mountStepEngine({ stage, veil, panels });
    return () => {
      unmount();
      root.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return (
    <div
      ref={stageRef}
      data-stage
      className="fixed inset-0 z-10 h-dvh w-full overflow-hidden overscroll-none bg-void select-none"
      style={{ touchAction: "none" }}
    >
      <style>{`
        .step-hint { opacity: 0; animation: step-hint 2.4s ease-in-out 3s infinite; }
        @keyframes step-hint { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        @keyframes step-hint-in { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .step-hint { animation: step-hint-in 0.4s linear 3s 1 forwards; } }
      `}</style>
      {beats.map((beat, index) => {
        const Scene = scenes[beat.id];
        return Scene ? <Scene key={beat.id} beat={beat} index={index} /> : <DummyPanel key={beat.id} beat={beat} index={index} />;
      })}
      {/* warp veil: above the beats, below the rail */}
      <div
        ref={veilRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 bg-black"
        style={{ visibility: "hidden", opacity: 0 }}
      />
      <ProgressRail />
      <RestHud />
      <ExhibitPanel />
    </div>
  );
}
