"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { goTo, registerBeat } from "@/lib/step";
import { Panel, type SceneProps } from "./common";

const DISCLAIMER =
  "SpaceMuse is an independent project for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. Images and footage courtesy of NASA and partners; see Sources & Credits.";

let introPlayed = false;

export function HeroScene({ beat, index }: SceneProps) {
  const img = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const tagline = useRef<HTMLParagraphElement>(null);
  const hudTop = useRef<HTMLParagraphElement>(null);
  const hudBottom = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);

  useEffect(
    () =>
      registerBeat("hero", ({ el, reducedMotion }) => {
        const undo: (() => void)[] = [];
        const tl = gsap.timeline({ paused: true });
        let ambient: gsap.core.Tween | null = null;
        let intro: gsap.core.Timeline | null = null;
        let alive = true;

        const split = title.current ? SplitText.create(title.current, { type: "chars" }) : null;
        if (split) undo.push(() => split.revert());

        // rest frame = everything visible
        tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power3.inOut" }, 0);
        tl.to(img.current, { opacity: 1, duration: 1, ease: "power3.inOut" }, 0);
        const texts = [hudTop.current, tagline.current, hudBottom.current, hint.current, title.current];
        tl.to(texts, { autoAlpha: 1, duration: 0.3 }, 0.5);
        if (split) tl.fromTo(split.chars, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.05, ease: "expo.out" }, 0.5);

        const startAmbient = () => {
          if (ambient || reducedMotion || !alive) return;
          ambient = gsap.fromTo(
            img.current,
            { scale: 1 },
            { scale: 1.04, duration: 20, ease: "sine.inOut", yoyo: true, repeat: -1 },
          );
        };
        tl.call(startAmbient, [], ">");
        undo.push(() => ambient?.kill());

        // First load: the engine builds the rest frame; play the title reveal once on top of it.
        if (!introPlayed && !reducedMotion) {
          queueMicrotask(() => {
            if (!alive || introPlayed) return;
            introPlayed = true;
            intro = gsap.timeline();
            intro.fromTo(img.current, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power3.inOut" }, 0);
            if (split) intro.fromTo(split.chars, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 1, stagger: 0.06, ease: "expo.out" }, 0.9);
            // text appears after the camera has settled ~70%
            intro.fromTo(
              [tagline.current, hudTop.current, hudBottom.current, hint.current],
              { autoAlpha: 0, y: 12 },
              { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.12 },
              1.7,
            );
            startAmbient();
          });
        }

        return {
          timeline: tl,
          cleanup: () => {
            alive = false;
            intro?.kill();
            undo.forEach((u) => u());
          },
        };
      }),
    [],
  );

  return (
    <Panel beat={beat} index={index}>
      <div ref={img} className="absolute inset-0 origin-center will-change-transform">
        <picture>
          <source media="(max-width: 768px)" srcSet="/media/images/hero_vab_storm-1280.avif" type="image/avif" />
          <source media="(max-width: 768px)" srcSet="/media/images/hero_vab_storm-1280.jpg" type="image/jpeg" />
          <source srcSet="/media/images/hero_vab_storm-2560.avif" type="image/avif" />
          <img
            src="/media/images/hero_vab_storm-2560.jpg"
            alt="The Vehicle Assembly Building at Kennedy Space Center under a storm sky"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      </div>
      <div aria-hidden className="fog fog-a bottom-[8%] h-[40%]" />
      <div aria-hidden className="fog fog-b bottom-[28%] h-[34%]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/85 via-void/20 to-void/40" />

      <p
        ref={hudTop}
        className="font-hud absolute left-6 top-6 z-10 text-[11px] text-platinum sm:left-10 sm:top-8"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        {beat.sub}
      </p>

      <div className="absolute inset-x-0 top-[34%] z-10 px-6 pr-16 sm:px-10 sm:pr-40">
        <h1
          ref={title}
          className="font-display whitespace-nowrap text-[clamp(1.6rem,8.2vw,8rem)] leading-none"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          {beat.title}
        </h1>
        <p
          ref={tagline}
          className="mt-5 max-w-xl text-lg text-text sm:text-xl"
          style={{ opacity: 0, visibility: "hidden" }}
        >
          {beat.caption}
        </p>
      </div>

      <div
        ref={hudBottom}
        data-step-ignore
        className="absolute bottom-5 left-6 z-30 flex max-w-[calc(100%-5rem)] flex-col gap-3 sm:left-10 sm:max-w-[min(36rem,50vw)]"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <p className="font-hud text-[11px] text-platinum">ADMISSION FREE · EST. VISIT 10 MIN</p>
        <button
          type="button"
          onClick={() => goTo("deep-space")}
          className="font-hud w-fit cursor-pointer border-b border-platinum/40 pb-0.5 text-xs text-text hover:border-starlight hover:text-starlight"
        >
          Skip to the galleries →
        </button>
        <p className="font-hud text-[9px] leading-relaxed text-mute normal-case tracking-normal">{DISCLAIMER}</p>
      </div>
      <p
        ref={hint}
        aria-hidden
        className="font-hud pointer-events-none absolute bottom-[4.5rem] right-6 z-10 text-xs text-text sm:bottom-6 sm:right-24"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        Scroll to begin ↓
      </p>
    </Panel>
  );
}
