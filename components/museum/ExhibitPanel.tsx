"use client";

import { useEffect, useRef } from "react";
import { exhibits, exhibitBySlug } from "@/content/exhibits";
import { site } from "@/content/site";
import { useMuseum } from "@/lib/store";
import { ExhibitMedia, ExhibitText } from "./ExhibitContent";

const ORDER = [...exhibits].sort((a, b) => (a.hall === b.hall ? a.order - b.order : a.hall === "moon" ? -1 : 1));
const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"]),summary';

export function ExhibitPanel() {
  const slug = useMuseum((s) => s.activeExhibit);
  const openExhibit = useMuseum((s) => s.openExhibit);
  const closeExhibit = useMuseum((s) => s.closeExhibit);
  const visitedCount = useMuseum((s) => s.visited.length);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ex = slug ? exhibitBySlug(slug) : undefined;
  const idx = ex ? ORDER.findIndex((e) => e.slug === ex.slug) : -1;
  const prev = idx > 0 ? ORDER[idx - 1] : undefined;
  const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : undefined;
  const open = !!ex;

  // Keyboard: Esc, arrows, focus trap. Focus moves into the dialog and returns on close.
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLElement>("[data-close]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      const el = root.current;
      if (!el) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeExhibit();
      } else if (e.key === "ArrowLeft" && prev) {
        openExhibit(prev.slug);
      } else if (e.key === "ArrowRight" && next) {
        openExhibit(next.slug);
      } else if (e.key === "Tab") {
        const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !el.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !el.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      before?.focus?.();
    };
  }, [open, prev, next, openExhibit, closeExhibit]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [slug]);

  if (!ex) return null;

  return (
    <div
      ref={root}
      data-step-ignore
      role="dialog"
      aria-modal="true"
      aria-labelledby="exhibit-title"
      className="fixed inset-0 z-50 flex items-end md:items-stretch"
    >
      <div className="absolute inset-0 bg-void/70" onClick={closeExhibit} aria-hidden />
      <section className="relative mt-12 flex max-h-[calc(100dvh-3rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface/85 shadow-2xl backdrop-blur-xl md:mt-0 md:max-h-none md:rounded-none">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <span className="font-hud text-[11px] text-mute">
            {ex.hall === "moon" ? "Hall I · The Moon" : "Hall II · Mars"} · {ex.catalogNo}
          </span>
          <button data-close type="button" onClick={closeExhibit} className="font-hud rounded border border-line px-3 py-1.5 text-[11px] text-text hover:border-platinum">
            {site.close} ✕
          </button>
        </header>

        <div ref={scroller} className="grid flex-1 overflow-y-auto md:grid-cols-[1.1fr_1fr] md:overflow-hidden">
          <div className="p-5 md:overflow-y-auto md:p-8">
            <ExhibitMedia ex={ex} />
          </div>
          <div className="p-5 md:overflow-y-auto md:border-l md:border-line md:p-8">
            <ExhibitText ex={ex} headingId="exhibit-title" />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
          <button type="button" disabled={!prev} onClick={() => prev && openExhibit(prev.slug)} className="rounded px-2 py-1 text-text hover:text-starlight disabled:opacity-30">
            {prev ? `← ${prev.name}` : ""}
          </button>
          <span className="font-hud hidden text-[11px] text-mute sm:block">{site.passport(visitedCount)}</span>
          <button type="button" disabled={!next} onClick={() => next && openExhibit(next.slug)} className="rounded px-2 py-1 text-text hover:text-starlight disabled:opacity-30">
            {next ? `${next.name} →` : ""}
          </button>
        </footer>
      </section>
    </div>
  );
}
