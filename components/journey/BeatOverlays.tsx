"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { beatIndexById, beats } from "@/content/beats";
import { grailSim, journey, transitTimeline } from "@/content/journey";
import { expedition, guide } from "@/content/guide";
import { narrationFor } from "@/lib/expedition";
import { replayGrailSim } from "@/components/journey/three/simulationBus";
import { exhibitBySlug } from "@/content/exhibits";
import { silence } from "@/content/silence";
import { site } from "@/content/site";
import { teaser, teaserItems } from "@/content/teaser";
import type { Beat } from "@/content/types";
import { scrollState, scrollToBeat } from "@/lib/scroll/progress";
import { useMuseum } from "@/lib/store";


const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Audio-guide line: fades in as the camera settles on the beat (|current - index| < ~0.3). */
function Narration({ beat }: { beat: Beat }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const index = beatIndexById(beat.id);
  const text = narrationFor(beat.id);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "none";
      return;
    }
    const apply = () => {
      const d = Math.abs(scrollState.current - index);
      const r = clamp01((0.38 - d) / 0.2);
      el.style.opacity = r.toFixed(3);
      el.style.transform = `translateY(${((1 - r) * 8).toFixed(2)}px)`;
    };
    apply();
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, [reducedMotion, index]);

  // Silence: the card intro already says this line, so skip it there.
  if (!text || beat.id === "silence") return null;
  // The Beyond card fills small screens; the line would collide, so it is desktop-only there.
  const desktopOnly = beat.id === "beyond" || beat.id === "hero";
  return (
    <p
      ref={ref}
      aria-hidden
      className={`narration pointer-events-none absolute left-6 top-[5.25rem] z-10 max-w-[34ch] text-base leading-snug text-text sm:left-12 sm:top-24 sm:text-[clamp(1.125rem,1.4vw,1.375rem)] ${
        desktopOnly ? "hidden sm:block" : ""
      }`}
      style={{ opacity: 0, textShadow: "0 1px 14px rgba(5,6,10,0.9), 0 0 3px rgba(5,6,10,0.8)" }}
    >
      {text}
    </p>
  );
}

/** Transit: years appear left to right along a platinum hairline while the beat scrolls through. */
function TransitTimeline({ index }: { index: number }) {
  const ref = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMuseum((s) => s.reducedMotion);

  useLayoutEffect(() => {
    const list = ref.current;
    const line = lineRef.current;
    if (!list || !line) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-year]"));
    const n = items.length;
    const apply = () => {
      const t = reducedMotion ? 1 : clamp01((scrollState.current - (index - 0.36)) / 0.36);
      line.style.transform = `scaleX(${t.toFixed(3)})`;
      items.forEach((el, i) => {
        const r = clamp01(t * (n + 0.5) - i);
        el.style.opacity = r.toFixed(3);
      });
    };
    apply();
    if (reducedMotion) return;
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, [reducedMotion, index]);

  return (
    <div className="relative mt-6 w-full max-w-2xl">
      <div
        ref={lineRef}
        aria-hidden
        className="absolute left-0 right-0 top-[0.4rem] h-px origin-left bg-platinum/60"
        style={{ transform: "scaleX(0)" }}
      />
      <ol ref={ref} className="relative flex justify-between gap-1" aria-label="Mars landings timeline">
        {transitTimeline.map((t) => (
          <li key={t.year} data-year className="flex flex-col items-start gap-1" style={{ opacity: 0 }}>
            <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-platinum" />
            <span className="font-hud text-[11px] text-text sm:text-xs">
              {t.year}
            </span>
            <span className="font-hud hidden text-[9px] text-mute sm:block">{t.name}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Briefing() {
  const [open, setOpen] = useState(false);
  const b = expedition.briefing;
  return (
    <div
      data-hud-card
      className="pointer-events-auto absolute right-3 top-[9.5rem] z-10 w-[min(19rem,calc(100vw-4.5rem))] rounded-lg border border-line/80 bg-surface/75 p-4 backdrop-blur-md sm:right-24 sm:top-24 sm:w-[24rem] sm:p-5"
    >
      <p className="font-hud text-[10px] text-starlight sm:text-[11px]">{b.eyebrow}</p>
      <h2 className="font-display mt-1.5 text-lg leading-tight text-text sm:text-2xl">{b.title}</h2>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="font-hud mt-2 cursor-pointer text-[10px] text-platinum hover:text-text sm:hidden"
      >
        {open ? expedition.briefing.hide : expedition.briefing.read}
      </button>
      <div className={`${open ? "block" : "hidden"} sm:block`}>
        {b.body.map((p, i) => (
          <p key={i} className="mt-3 text-[13px] leading-relaxed text-text/90 sm:text-sm">
            {p}
          </p>
        ))}
        <p className="mt-3 text-xs leading-relaxed text-mute">{b.honesty}</p>
        <p className="font-hud mt-3 text-[9px] leading-snug text-mute/80">{b.source}</p>
      </div>
    </div>
  );
}

function EnterOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">
      <Briefing />
      <div data-hud-card className="relative z-10 max-w-2xl">
        <div className="font-hud text-shadow-copy mb-3 flex flex-wrap items-center gap-2.5 text-[11px] text-platinum">
          <span>{beat.sub}</span>
          <span className="text-line">·</span>
          <span className="text-starlight">{journey.enter.location}</span>
        </div>
      </div>
    </div>
  );
}

/** Ignition overlay — no countdown clutter in center; highlights ROFI sparks, RS-25 + SRB thrust & liftoff. */
function IgnitionOverlay({ beat }: { beat: Beat }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-end px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">

      <div
        data-hud-card
        className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="max-w-2xl">
          <div className="font-hud text-shadow-copy mb-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-platinum">
            <span className="inline-block h-2 w-2 rounded-full bg-ignite" />
            <span>{journey.ignition.event}</span>
          </div>
          <h2
            className="font-display text-shadow-display text-[clamp(2.5rem,8.5vw,6.2rem)] leading-none"
            style={{ color: "var(--ignite)" }}
          >
            {beat.title}
          </h2>
          <p className="font-hud text-shadow-copy mt-3 text-xs text-text">{beat.sub}</p>
        </div>

        <div className="font-hud rounded border border-line/80 bg-surface/75 px-4 py-3 text-[10px] leading-relaxed text-platinum backdrop-blur-md">
          <div className="text-text">{journey.ignition.telemetryTitle}</div>
          <div className="mt-1 text-mute">{journey.ignition.core}</div>
          <div className="text-mute">{journey.ignition.boosters}</div>
        </div>
      </div>
    </div>
  );
}

function AscentOverlay({ beat }: { beat: Beat }) {
  const hud = journey.ascent[beat.id];
  return (
    <div className="relative flex h-full w-full items-end justify-between px-6 pb-14 pr-14 sm:px-12 sm:pb-16 sm:pr-36">
      <div
        data-hud-card
        className="relative z-10 flex w-full flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="font-hud flex flex-col gap-1 rounded border border-line/80 bg-surface/75 px-4 py-3 text-[11px] text-platinum backdrop-blur-md">
          <span className="text-starlight">{hud?.event}</span>
          <span className="text-text">{hud?.met}</span>
          <span className="mt-1 text-[10px] text-mute">{hud?.sys}</span>
          <span className="text-[10px] text-mute">{hud?.thrust}</span>
        </div>
        <div className="max-w-lg">
          {beat.title ? (
            <h2 className="font-display text-shadow-display mb-3 text-[clamp(1.75rem,4.5vw,3.25rem)] leading-tight text-white">
              {beat.title}
            </h2>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function hallEvent(id: string): string {
  if (id === "deep-space") return expedition.moonMap.label;
  if (id === "transit") return expedition.marsMap.label;
  return journey.hall[id];
}

function HallTitleOverlay({ beat }: { beat: Beat }) {
  const isMars = beat.rail === "MARS";
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-16 pr-14 sm:px-12 sm:pb-20 sm:pr-36">
      <div data-hud-card className="relative z-10 max-w-2xl">
        <div
          className="font-hud text-shadow-copy mb-3 flex flex-wrap items-center gap-2.5 text-xs"
          style={{ color: isMars ? "var(--oxide)" : "var(--starlight)" }}
        >
          <span>{beat.sub}</span>
          <span className="text-line">·</span>
          <span>{hallEvent(beat.id)}</span>
        </div>
        {beat.id === "transit" ? (
          <p className="font-hud text-shadow-copy -mt-1 mb-3 text-[11px] text-platinum">{journey.hall.transit}</p>
        ) : null}
        <h2 className="font-display text-shadow-display text-[clamp(2rem,6vw,4.5rem)] leading-none text-white">
          {beat.title}
        </h2>
        <p className="text-shadow-copy mt-4 text-base font-medium text-white/95 sm:text-xl">{beat.caption}</p>
        {beat.id === "transit" ? <TransitTimeline index={beatIndexById("transit")} /> : null}
      </div>
    </div>
  );
}

function ExhibitBeatOverlay({ beat }: { beat: Beat }) {
  const ex = beat.exhibitSlug ? exhibitBySlug(beat.exhibitSlug) : undefined;
  const openExhibit = useMuseum((s) => s.openExhibit);
  const visited = useMuseum((s) => s.visited);
  const isStatic = useMuseum((s) => s.reducedMotion || s.lightweight || s.webglFailed);
  if (!ex) return null;
  const g = guide[ex.slug];

  const isMoon = ex.hall === "moon";
  const hasStamp = visited.includes(ex.slug);
  const coords =
    ex.location.lat !== undefined && ex.location.lon !== undefined
      ? ` · ${Math.abs(ex.location.lat).toFixed(2)}°${ex.location.lat >= 0 ? "N" : "S"} ${Math.abs(
          ex.location.lon,
        ).toFixed(2)}°${ex.location.lon >= 0 ? "E" : "W"}`
      : "";

  return (
    <div className="relative flex h-full w-full items-end px-6 pb-12 pr-14 sm:px-12 sm:pb-14 sm:pr-36">
      <div
        data-hud-card
        className="pointer-events-auto relative z-10 max-w-lg rounded-lg border border-line bg-surface/75 p-5 backdrop-blur-md sm:p-6"
      >
        <div className="font-hud flex flex-wrap items-center gap-2 text-[11px] text-mute">
          <span style={{ color: isMoon ? "var(--lunar)" : "var(--oxide)" }}>{ex.catalogNo}</span>
          <span>·</span>
          <span>{isMoon ? journey.exhibit.hallMoon : journey.exhibit.hallMars}</span>
          <span>·</span>
          <span className={ex.status === "still-active" ? "text-starlight" : "text-ignite"}>
            {ex.statusLabel ?? (ex.status === "still-active" ? journey.exhibit.stillActive : journey.exhibit.silent)}
          </span>
        </div>

        <h2 className="font-display mt-2 text-2xl leading-tight text-text sm:text-3xl">{ex.name}</h2>
        <p className="font-hud mt-1 text-[10px] text-platinum">
          {ex.location.site}
          {coords}
        </p>
        {g ? (
          <div className="mt-3 space-y-2.5">
            <div>
              <p className="font-hud text-[10px] text-starlight">{expedition.questions.what}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-text/90 sm:text-sm">{g.what}</p>
            </div>
            <div>
              <p className="font-hud text-[10px] text-starlight">{expedition.questions.why}</p>
              <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-text/90 sm:line-clamp-none sm:text-sm">{g.why}</p>
            </div>
          </div>
        ) : null}
        <p className="font-hud mt-2.5 text-[9px] text-mute">{expedition.scale}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => openExhibit(ex.slug)}
            className="font-hud cursor-pointer rounded border border-starlight/60 bg-raised/90 px-4 py-2 text-xs text-starlight transition-colors hover:border-starlight hover:bg-starlight hover:text-void"
          >
            {site.explore} →
          </button>
          {ex.slug === "moon-grail" && !isStatic ? (
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => replayGrailSim()}
                className="font-hud cursor-pointer rounded border border-line bg-raised/90 px-3 py-2 text-xs text-text transition-colors hover:border-platinum"
              >
                {"\u21BB "}{grailSim.replay}
              </button>
            </div>
          ) : null}
          {hasStamp ? <span className="font-hud text-[10px] text-platinum">{expedition.found}</span> : null}
        </div>
        {ex.slug === "moon-grail" && !isStatic ? (
          <p className="font-hud mt-2 text-[9px] text-mute">{grailSim.note}</p>
        ) : null}
      </div>
    </div>
  );
}

const SILENCE_INDEX = beatIndexById("silence");

/** Hall of Silence: wall lines appear one by one as the scroll approaches the beat. Reflector glows instead of dimming. */
function SilenceOverlay() {
  const wallRef = useRef<HTMLUListElement>(null);
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const rows = silence.wall;

  useLayoutEffect(() => {
    const list = wallRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLElement>("[data-wall-row]"));
    const n = items.length;
    // Reveal window (inside the beat cross-fade): from 0.36 beat before the silence beat until the beat itself.
    const START = SILENCE_INDEX - 0.36;
    const SPAN = 0.36;
    const apply = () => {
      const t = reducedMotion ? 1 : (scrollState.current - START) / SPAN;
      items.forEach((el, i) => {
        const r = Math.min(1, Math.max(0, t * (n + 1) - i));
        const active = el.dataset.active === "true";
        el.style.opacity = String(r * (active ? 1 : 0.7));
        el.style.transform = `translateY(${((1 - r) * 8).toFixed(2)}px)`;
      });
    };
    apply();
    if (reducedMotion) return;
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, [reducedMotion]);

  return (
    <div className="relative flex h-full w-full items-start px-4 pb-6 pt-[5.5rem] pr-12 sm:items-center sm:px-12 sm:py-14 sm:pr-32">
      <div
        data-hud-card
        data-lenis-prevent
        className="pointer-events-auto max-h-[calc(100dvh-6.5rem)] w-full max-w-4xl overflow-y-auto rounded-lg border border-platinum/25 bg-surface/80 p-4 backdrop-blur-lg sm:p-8"
      >
        <p className="font-hud text-[10px] text-mute sm:text-[11px]">{journey.silence.eyebrow}</p>
        <h2 className="font-display mt-1.5 text-xl text-text sm:mt-2 sm:text-4xl">{silence.title}</h2>
        <p className="mt-1.5 max-w-2xl text-xs text-mute sm:mt-2 sm:text-base">{silence.intro}</p>

        <ul
          ref={wallRef}
          className="mt-3 grid gap-x-8 gap-y-0.5 border-y border-platinum/20 py-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-y-1.5 sm:py-4"
        >
          {rows.map((row) => (
            <li
              key={row.name}
              data-wall-row
              data-active={row.active ? "true" : "false"}
              className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-line/30 py-0.5 text-[12px] will-change-[opacity,transform] sm:text-sm"
            >
              <span className={`font-medium ${row.active ? "text-starlight" : "text-text"}`}>{row.name}</span>
              <span
                className={`font-hud text-[9px] sm:text-[10px] ${row.active ? "text-starlight" : "text-mute"}`}
                style={row.active ? { textShadow: "0 0 10px var(--starlight), 0 0 22px var(--starlight)" } : undefined}
              >
                {row.last}
                {row.note ? ` · ${row.note}` : ""}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3">
          {silence.numbers.map((n, idx) => (
            <p
              key={idx}
              className="rounded border border-line bg-raised/50 p-2.5 text-[11px] leading-snug text-text/90 sm:p-3 sm:text-xs sm:leading-relaxed"
            >
              {n.text}
            </p>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-snug text-mute sm:mt-4 sm:text-xs sm:leading-relaxed">
          {silence.heritage.text}
        </p>
      </div>
    </div>
  );
}

function BeyondOverlay() {
  const [active, setActive] = useState<number | null>(null);
  const item = active !== null ? teaserItems[active] : null;

  return (
    <div className="relative flex h-full w-full items-end px-4 pb-10 pr-12 sm:px-12 sm:pb-14 sm:pr-32">
      <div
        data-hud-card
        className="pointer-events-auto w-full max-w-5xl rounded-lg border border-platinum/25 bg-surface/65 p-4 backdrop-blur-md sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-hud text-[10px] text-starlight sm:text-[11px]">{teaser.title}</p>
            <p className="mt-1.5 text-xs text-text/90 sm:text-base">{teaser.line}</p>
          </div>
          <span className="font-hud rounded border border-platinum/30 px-2.5 py-1 text-[10px] text-platinum">
            {journey.beyond.badge}
          </span>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 lg:grid-cols-4">
          {teaserItems.map((it, i) => (
            <li key={it.catalogNo}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                onClick={() => setActive(i)}
                aria-label={`${it.catalogNo}: ${it.name}, ${it.year}. ${it.line}`}
                className={`flex h-20 w-full cursor-pointer flex-col justify-between rounded border bg-void/60 p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-starlight sm:h-28 ${
                  active === i ? "border-starlight/70" : "border-line hover:border-starlight/50"
                }`}
              >
                <span className="font-hud text-[10px] text-mute">{it.catalogNo}</span>
                <span
                  className={`font-hud text-[10px] ${it.status === "still-travelling" ? "text-starlight" : "text-platinum/70"}`}
                >
                  {it.status === "still-travelling" ? "STILL TRAVELLING" : journey.beyond.soon}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p aria-hidden className="mt-3 min-h-10 text-xs text-text sm:min-h-6 sm:text-sm">
          {item ? (
            <>
              <span className="font-display text-sm sm:text-base">{item.name}</span>
              <span className="text-platinum"> · {item.year} · </span>
              <span className={item.status === "still-travelling" ? "font-hud text-starlight" : "text-text/90"}>
                {item.line}
              </span>
            </>
          ) : (
            <span className="text-mute">{journey.beyond.hint}</span>
          )}
        </p>

        <p className="font-hud mt-2 text-[10px] text-starlight">{teaser.voyagerNote}</p>
      </div>
    </div>
  );
}

function FinaleOverlay() {
  return (
    <div className="relative flex h-full w-full items-end px-6 pb-14 pr-14 sm:px-12 sm:pb-20 sm:pr-32">
      <div data-hud-card className="pointer-events-auto relative z-10 max-w-2xl">
        <p className="font-hud text-shadow-copy mb-3 text-[11px] text-platinum">{journey.finale.eyebrow}</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/collection"
            className="font-hud rounded border border-starlight/60 bg-raised/85 px-4 py-2 text-xs text-starlight transition-colors hover:bg-starlight hover:text-void"
          >
            {journey.finale.revisit}
          </Link>
          <Link
            href="/about"
            className="font-hud rounded border border-line bg-surface/80 px-4 py-2 text-xs text-text transition-colors hover:border-platinum"
          >
            {journey.finale.sources}
          </Link>
          <button
            type="button"
            onClick={() => scrollToBeat(1)}
            className="font-hud cursor-pointer px-2 py-2 text-xs text-mute transition-colors hover:text-text"
          >
            {journey.finale.back}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed, stationary overlay for one beat: cross-fades in place from the scroll distance to the beat. */
function FadeLayer({ index, children }: { index: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    const apply = () => {
      const d = Math.abs(scrollState.current - index);
      const r = clamp01((0.38 - d) / 0.2);
      if (r === last) return;
      last = r;
      const off = r < 0.01;
      el.style.opacity = r.toFixed(3);
      el.style.transform = `translateY(${((1 - r) * 6).toFixed(2)}px)`;
      el.style.visibility = off ? "hidden" : "visible";
      el.inert = off;
    };
    apply();
    gsap.ticker.add(apply);
    return () => {
      gsap.ticker.remove(apply);
    };
  }, [index]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-10 will-change-[opacity]"
      style={{ opacity: 0, visibility: "hidden" }}
      inert
    >
      {children}
    </div>
  );
}

export function BeatSection({ beat, poster }: { beat: Beat; poster?: React.ReactNode }) {
  const reducedMotion = useMuseum((s) => s.reducedMotion);
  const lightweight = useMuseum((s) => s.lightweight);
  const webglFailed = useMuseum((s) => s.webglFailed);
  const isStatic = reducedMotion || lightweight || webglFailed;
  const index = beatIndexById(beat.id);

  let content: React.ReactNode = null;
  if (beat.id === "enter") content = <EnterOverlay beat={beat} />;
  else if (beat.id === "ignition") content = <IgnitionOverlay beat={beat} />;
  else if (beat.act === "ascent") content = <AscentOverlay beat={beat} />;
  else if (beat.id === "deep-space" || beat.id === "transit") content = <HallTitleOverlay beat={beat} />;
  else if (beat.exhibitSlug) content = <ExhibitBeatOverlay beat={beat} />;
  else if (beat.id === "silence") content = <SilenceOverlay />;
  else if (beat.id === "beyond") content = <BeyondOverlay />;
  else if (beat.id === "finale") content = <FinaleOverlay />;

  const body = (
    <>
      {content}
      <Narration beat={beat} />
    </>
  );

  // Static / reduced-motion: posters scroll in flow, overlays stay with their poster (no fade needed).
  if (isStatic) {
    return (
      <section
        id={beat.id}
        data-beat={beat.id}
        className="pointer-events-none relative h-dvh w-full shrink-0"
      >
        {poster}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
        />
        <div className="absolute inset-0">{body}</div>
      </section>
    );
  }

  // Live 3D: the section is an invisible height spacer (ScrollTrigger / Lenis / hash anchors);
  // its content lives in a fixed layer that cross-fades in place.
  return (
    <section
      id={beat.id}
      data-beat={beat.id}
      className="pointer-events-none relative h-dvh w-full shrink-0"
    >
      <FadeLayer index={index}>{body}</FadeLayer>
    </section>
  );
}

export { beats };
