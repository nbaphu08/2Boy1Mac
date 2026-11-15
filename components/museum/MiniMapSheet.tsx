"use client";

import { useCallback, useEffect, useRef } from "react";
import { expedition } from "@/content/guide";
import { MiniMap } from "./MiniMap";

const T = expedition.minimap;

export function MiniMapSheet({
  hall,
  currentSlug,
  onJump,
  onClose,
}: {
  hall: "moon" | "mars";
  currentSlug: string | null;
  onJump: (slug: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const f = ref.current.querySelectorAll<HTMLElement>("button");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [onKey]);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-void/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="minimap-title"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-surface p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="minimap-title" className="font-hud text-sm text-text">
            {T.title} · {hall === "moon" ? T.moon : T.mars}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="font-hud min-h-11 cursor-pointer rounded border border-line px-3 text-[11px] text-mute hover:text-text"
          >
            {T.close}
          </button>
        </div>
        <div className="mt-3">
          <MiniMap
            hall={hall}
            currentSlug={currentSlug}
            large
            chips
            onJump={(s) => {
              onJump(s);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
