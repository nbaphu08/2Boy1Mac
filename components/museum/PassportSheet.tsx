"use client";

import { useCallback, useEffect, useRef } from "react";
import { exhibits } from "@/content/exhibits";
import { site } from "@/content/site";
import { useMuseum } from "@/lib/store";

const CERT_LINE = "You have visited every machine in the SpaceMuse collection.";

function formatDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function downloadCertificate(date: string) {
  const w = 1600;
  const h = 1130;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) return;
  g.fillStyle = "#04060B";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#C7CDD8";
  g.lineWidth = 3;
  g.strokeRect(50, 50, w - 100, h - 100);
  g.strokeStyle = "#1E2638";
  g.lineWidth = 1;
  g.strokeRect(70, 70, w - 140, h - 140);
  g.textAlign = "center";
  g.fillStyle = "#8089A0";
  g.font = "28px ui-monospace, Menlo, monospace";
  g.fillText(site.wordmark.split("").join(" "), w / 2, 190);
  g.fillStyle = "#E8ECF4";
  g.font = "700 84px Helvetica, Arial, sans-serif";
  g.fillText("Certificate of Visit", w / 2, 400);
  g.fillStyle = "#9DB8FF";
  g.font = "34px ui-monospace, Menlo, monospace";
  g.fillText(date, w / 2, 490);
  g.fillStyle = "#C7CDD8";
  g.font = "italic 38px Georgia, serif";
  g.fillText(`“${CERT_LINE}”`, w / 2, 640);
  g.fillStyle = "#8089A0";
  g.font = "24px ui-monospace, Menlo, monospace";
  g.fillText(exhibits.map((e) => e.catalogNo).join("  ·  ").slice(0, 400), w / 2, 800, w - 240);
  g.fillText("12 / 12 STAMPS", w / 2, 860);
  g.font = "20px Helvetica, Arial, sans-serif";
  g.fillText("An independent project for the NASA Space Apps Challenge 2026. Not affiliated with NASA.", w / 2, h - 110);
  const a = document.createElement("a");
  a.download = "spacemuse-certificate-of-visit.png";
  a.href = c.toDataURL("image/png");
  a.click();
}

export function PassportSheet({ onClose }: { onClose: () => void }) {
  const visited = useMuseum((s) => s.visited);
  const visitedAt = useMuseum((s) => s.visitedAt);
  const ref = useRef<HTMLDivElement>(null);
  const count = exhibits.filter((e) => visited.includes(e.slug)).length;
  const total = exhibits.length;
  const complete = count >= total;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const f = ref.current.querySelectorAll<HTMLElement>("button, a[href]");
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

  const latest = Object.values(visitedAt).sort().pop();

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="passport-title"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-surface p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="passport-title" className="font-display text-xl">Museum Passport</h2>
            <p className="font-hud mt-1 text-[11px] text-mute">{site.passport(count)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-hud cursor-pointer rounded border border-line px-2 py-1 text-[11px] text-mute hover:text-text"
          >
            {site.close}
          </button>
        </div>
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {exhibits.map((ex) => {
            const on = visited.includes(ex.slug);
            return (
              <li
                key={ex.slug}
                className={`flex aspect-square flex-col items-center justify-center rounded-md border p-1 text-center ${
                  on ? "border-platinum bg-platinum text-void" : "border-dashed border-line text-mute"
                }`}
              >
                <span className="font-hud text-[10px] leading-tight">{ex.catalogNo}</span>
                <span className="mt-1 text-[10px] leading-tight">{ex.name}</span>
                <span className="font-hud mt-1 text-[9px] leading-tight">
                  {on ? (visitedAt[ex.slug] ?? "✓") : "NOT VISITED"}
                </span>
                <span className="sr-only">{on ? "visited" : "not visited"}</span>
              </li>
            );
          })}
        </ul>
        {complete ? (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-sm text-platinum">{`"${CERT_LINE}"`}</p>
            <button
              type="button"
              onClick={() => downloadCertificate(formatDate(latest))}
              className="font-hud mt-3 cursor-pointer rounded border border-starlight/60 px-4 py-2 text-xs text-starlight hover:bg-starlight hover:text-void"
            >
              Download Certificate of Visit (PNG)
            </button>
          </div>
        ) : (
          <p className="mt-5 text-xs text-mute">Open an exhibit to collect its stamp.</p>
        )}
      </div>
    </div>
  );
}
