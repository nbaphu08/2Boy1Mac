"use client";

import { useEffect, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import type { Beat } from "@/content/types";
import { useMuseum } from "@/lib/store";

gsap.registerPlugin(SplitText);

export type SceneProps = { beat: Beat; index: number };
export type Clip = { src: string; mobileSrc: string; poster: string };

/** Letterbox bar height (each bar). */
export const BAR = "7dvh";

/** Fixed panel wrapper. Keep `data-beat` on it (engine contract). Layers: content, vignette, grain. */
export function Panel({ beat, index, children }: SceneProps & { children: ReactNode }) {
  return (
    <section
      data-beat={beat.id}
      className="absolute inset-0 overflow-hidden bg-void"
      style={{ visibility: index === 0 ? "visible" : "hidden", opacity: index === 0 ? 1 : 0 }}
    >
      {children}
      <div aria-hidden className="vignette" />
      <div aria-hidden className="grain" />
    </section>
  );
}

export function Letterbox({
  topRef,
  botRef,
}: {
  topRef?: RefObject<HTMLDivElement | null>;
  botRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div ref={topRef} aria-hidden className="absolute inset-x-0 top-0 z-20 origin-top bg-black" style={{ height: BAR }} />
      <div ref={botRef} aria-hidden className="absolute inset-x-0 bottom-0 z-20 origin-bottom bg-black" style={{ height: BAR }} />
    </>
  );
}

/** Set a video's source for the current breakpoint (once). Skipped for reduced motion (poster only). */
export function ensureSrc(v: HTMLVideoElement | null, clip: Clip | undefined) {
  if (!v || !clip || v.dataset.srcSet) return;
  if (useMuseum.getState().reducedMotion) return;
  const mobile = window.matchMedia("(max-width: 768px)").matches;
  v.dataset.srcSet = "1";
  v.preload = "auto";
  v.src = mobile ? clip.mobileSrc : clip.src;
}

/** Load videos only while the visitor is within [-1, +2] beats of them (n+1 / n+2 preload). */
export function useFootagePreload(refs: { ref: RefObject<HTMLVideoElement | null>; clip: Clip }[], index: number) {
  useEffect(() => {
    const check = (cur: number) => {
      if (cur >= index - 1 && cur <= index + 2) refs.forEach((r) => ensureSrc(r.ref.current, r.clip));
    };
    let last = useMuseum.getState().beatIndex;
    check(last);
    return useMuseum.subscribe((s) => {
      if (s.beatIndex !== last) {
        last = s.beatIndex;
        check(last);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
}

export const VIDEO_CLS = "absolute inset-0 h-full w-full object-cover";

/** Masked line reveal (bottom-up, 40 ms stagger, expo.out) of `el`, starting at time `at` of `tl`. */
export function revealLines(tl: gsap.core.Timeline, el: HTMLElement | null, at: number, undo: (() => void)[], dur = 0.9) {
  if (!el) return;
  tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, at);
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  undo.push(() => split.revert());
  tl.fromTo(split.lines, { yPercent: 110 }, { yPercent: 0, duration: dur, ease: "expo.out", stagger: 0.04 }, at);
}

export const fmtMet = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  const p = (n: number) => String(n).padStart(2, "0");
  return `T+${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
};

/** Tween a clock element from `from` to `to` seconds over the timeline segment [at, at+dur]. */
export function metTween(tl: gsap.core.Timeline, el: HTMLElement | null, from: number, to: number, at: number, dur: number) {
  if (!el) return;
  const o = { t: from };
  el.textContent = fmtMet(from);
  tl.to(
    o,
    {
      t: to,
      duration: dur,
      ease: "none",
      onUpdate: () => {
        el.textContent = fmtMet(o.t);
      },
    },
    at,
  );
}

export function Credit({ beat }: { beat: Beat }) {
  if (!beat.clip) return null;
  return (
    <p
      aria-hidden
      className="font-hud pointer-events-none absolute right-4 z-10 text-[9px] text-mute opacity-70 sm:right-16"
      style={{ bottom: `calc(${BAR} + 0.5rem)` }}
    >
      Footage: {beat.clip.credit}
    </p>
  );
}
