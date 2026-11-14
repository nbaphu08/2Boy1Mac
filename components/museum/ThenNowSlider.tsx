"use client";

import { useRef, useState } from "react";
type Img = { src: string; alt: string; credit: string };

export function ThenNowSlider({ then, now, label }: { then: Img; now: Img; label: string }) {
  const [pos, setPos] = useState(50); // % of width showing THEN
  const box = useRef<HTMLDivElement>(null);

  const setFromX = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <figure className="w-full">
      <div
        ref={box}
        className="relative aspect-[3/2] w-full select-none overflow-hidden rounded-md border border-line bg-void touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) setFromX(e.clientX);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={now.src} alt={now.alt} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={then.src}
          alt={then.alt}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false}
        />
        <span className="font-hud absolute left-2 top-2 rounded bg-void/70 px-2 py-0.5 text-[10px] text-text">Then</span>
        <span className="font-hud absolute right-2 top-2 rounded bg-void/70 px-2 py-0.5 text-[10px] text-text">Now</span>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-platinum" style={{ left: `${pos}%` }}>
          <div
            role="slider"
            tabIndex={0}
            aria-label={`${label}: compare then and now`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pos)}
            aria-valuetext={`${Math.round(pos)}% then`}
            className="pointer-events-auto absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-platinum bg-void/80 text-xs text-platinum"
            onKeyDown={(e) => {
              const step = e.shiftKey ? 20 : 5;
              if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - step));
              else if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + step));
              else if (e.key === "Home") setPos(0);
              else if (e.key === "End") setPos(100);
              else return;
              e.preventDefault();
              e.stopPropagation(); // keep ←/→ from switching exhibits
            }}
          >
            ⇆
          </div>
        </div>
      </div>
      <figcaption className="mt-2 grid gap-2 text-xs text-mute sm:grid-cols-2">
        <span>
          <b className="font-hud text-text">Then.</b> {then.alt} <span className="text-mute">({then.credit})</span>
        </span>
        <span>
          <b className="font-hud text-text">Now.</b> {now.alt} <span className="text-mute">({now.credit})</span>
        </span>
      </figcaption>
    </figure>
  );
}
