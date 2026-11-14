"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/content/site";

export type MapPin = {
  slug: string;
  catalogNo: string;
  name: string;
  site: string;
  status: string;
  active: boolean;
  lat?: number;
  lon?: number;
  coordNote?: string;
  coordSource?: string;
  landed: string;
  impact: boolean;
  lastContact?: string;
  young: string;
  poster: string;
};

type Hall = "moon" | "mars";

/** Map window in degrees. Must match the crop of the image files in public/media/images/map. */
const VIEW: Record<Hall, { img: string; lon0: number; lon1: number; lat0: number; lat1: number; grid: number }> = {
  moon: { img: "/media/images/map/moon-nearside", lon0: -90, lon1: 90, lat0: -20, lat1: 85, grid: 30 },
  mars: { img: "/media/images/map/mars-global", lon0: -180, lon1: 180, lat0: -60, lat1: 80, grid: 30 },
};

const M = site.map;

function fmtCoords(lat: number, lon: number) {
  return `${Math.abs(lat)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon)}°${lon >= 0 ? "E" : "W"}`;
}

function range(a: number, b: number, step: number) {
  const out: number[] = [];
  for (let v = Math.ceil(a / step) * step; v <= b; v += step) if (v !== a && v !== b) out.push(v);
  return out;
}

export function StoryMap({ pins }: { pins: Record<Hall, MapPin[]> }) {
  const [hall, setHall] = useState<Hall>("moon");
  const [selected, setSelected] = useState<Record<Hall, string>>({ moon: pins.moon[0].slug, mars: pins.mars[0].slug });

  const v = VIEW[hall];
  const lonSpan = v.lon1 - v.lon0;
  const latSpan = v.lat1 - v.lat0;
  const list = pins[hall];
  const sel = list.find((p) => p.slug === selected[hall]) ?? list[0];
  const select = (slug: string) => setSelected((s) => ({ ...s, [hall]: slug }));
  const x = (lon: number) => ((lon - v.lon0) / lonSpan) * 100;
  const y = (lat: number) => ((v.lat1 - lat) / latSpan) * 100;
  const unpinned = list.filter((p) => p.lat === undefined || p.lon === undefined);

  return (
    <section id="map" aria-labelledby="map-heading" className="mt-12 scroll-mt-6">
      <p className="font-hud text-[11px] tracking-[0.2em] text-platinum">{M.eyebrow}</p>
      <h2 id="map-heading" className="font-display mt-1 text-2xl md:text-3xl">{M.heading}</h2>
      <p className="mt-2 max-w-2xl text-sm text-mute">{M.intro}</p>

      <div role="tablist" aria-label={M.heading} className="font-hud mt-5 inline-flex rounded-full border border-line p-1 text-[11px]">
        {(["moon", "mars"] as const).map((h) => (
          <button
            key={h}
            role="tab"
            id={`map-tab-${h}`}
            aria-selected={hall === h}
            aria-controls="map-panel"
            onClick={() => setHall(h)}
            className={`rounded-full px-4 py-1.5 tracking-[0.15em] transition-colors ${hall === h ? "bg-platinum text-void" : "text-mute hover:text-text"}`}
          >
            {M.tabs[h].toUpperCase()}
          </button>
        ))}
      </div>

      <div id="map-panel" role="tabpanel" aria-labelledby={`map-tab-${hall}`} className="mt-4 grid gap-5 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className={hall === "mars" ? "-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" : ""}>
            <figure className={`relative ${hall === "mars" ? "min-w-[600px]" : ""}`}>
              <div
                className="relative w-full overflow-hidden rounded-md border border-line bg-surface"
                style={{ aspectRatio: `${lonSpan} / ${latSpan}` }}
              >
                <picture>
                  <source type="image/webp" srcSet={`${v.img}.webp`} />
                  <img
                    key={v.img}
                    src={`${v.img}.jpg`}
                    alt={M.regions[hall]}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </picture>
                <div className="pointer-events-none absolute inset-0 bg-void/25" />

                {/* Graticule every 30° */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  {range(v.lon0, v.lon1, v.grid).map((lon) => (
                    <line key={`x${lon}`} x1={x(lon)} x2={x(lon)} y1={0} y2={100} stroke="currentColor" className={lon === 0 ? "text-text/35" : "text-text/15"} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  ))}
                  {range(v.lat0, v.lat1, v.grid).map((lat) => (
                    <line key={`y${lat}`} y1={y(lat)} y2={y(lat)} x1={0} x2={100} stroke="currentColor" className={lat === 0 ? "text-text/35" : "text-text/15"} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
                {range(v.lat0, v.lat1, v.grid).map((lat) => (
                  <span key={`ly${lat}`} aria-hidden="true" className="font-hud pointer-events-none absolute left-1 -translate-y-full text-[9px] text-text/60" style={{ top: `${y(lat)}%` }}>
                    {lat === 0 ? "0°" : `${Math.abs(lat)}°${lat > 0 ? "N" : "S"}`}
                  </span>
                ))}
                {range(v.lon0, v.lon1, v.grid).map((lon) => (
                  <span key={`lx${lon}`} aria-hidden="true" className="font-hud pointer-events-none absolute bottom-1 pl-1 text-[9px] text-text/60" style={{ left: `${x(lon)}%` }}>
                    {lon === 0 ? "0°" : `${Math.abs(lon)}°${lon > 0 ? "E" : "W"}`}
                  </span>
                ))}

                {/* Pins (mouse/touch). Keyboard and screen readers use the list beside the map. */}
                {list.map((p, i) => {
                  if (p.lat === undefined || p.lon === undefined) return null;
                  const on = p.slug === sel.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      tabIndex={-1}
                      aria-hidden="true"
                      onClick={() => select(p.slug)}
                      className={`group absolute -translate-x-1/2 -translate-y-1/2 ${on ? "z-20" : "z-10 hover:z-20"}`}
                      style={{ left: `${x(p.lon)}%`, top: `${y(p.lat)}%` }}
                    >
                      {p.active && (
                        <span className="absolute inset-0 rounded-full bg-starlight/60 motion-safe:animate-ping" />
                      )}
                      <span
                        className={`font-hud relative flex items-center justify-center rounded-full border text-[10px] font-semibold shadow-[0_0_0_3px_rgba(0,0,0,0.35)] transition-all ${
                          on ? "h-7 w-7 border-text bg-text text-void" : `h-5 w-5 ${p.active ? "border-starlight bg-starlight/90 text-void" : "border-ignite bg-void/80 text-text"} group-hover:scale-125`
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={`font-hud pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-void/85 px-1.5 py-0.5 text-[10px] text-text ${
                          on ? "block" : "hidden group-hover:block"
                        }`}
                      >
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <figcaption className="mt-2 text-[11px] text-mute">{M.credit[hall]}</figcaption>
            </figure>
          </div>

          <ul className="font-hud mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-mute" aria-hidden="true">
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-starlight" />{M.legend.active}</li>
            <li className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-ignite" />{M.legend.silent}</li>
          </ul>
          {unpinned.map((p) => (
            <p key={p.slug} className="mt-2 text-[12px] text-mute">{M.unpinned(p.name, p.coordNote ?? M.notPublished)}</p>
          ))}

          <ol className="mt-4 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p, i) => {
              const on = p.slug === sel.slug;
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => select(p.slug)}
                    className={`flex w-full items-center gap-2 rounded border px-2.5 py-1.5 text-left text-sm transition-colors ${on ? "border-platinum bg-raised text-text" : "border-line text-mute hover:border-platinum hover:text-text"}`}
                  >
                    <span className={`font-hud flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${p.active ? "border-starlight text-starlight" : "border-ignite text-text"}`}>{i + 1}</span>
                    <span className="truncate">{p.name}</span>
                    {(p.lat === undefined || p.lon === undefined) && <span className="sr-only"> — {M.legend.unpinned}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <article aria-live="polite" className="self-start overflow-hidden rounded-md border border-line bg-surface lg:sticky lg:top-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-raised">
            <picture>
              <source type="image/avif" srcSet={`${sel.poster}.avif`} />
              <img key={sel.slug} src={`${sel.poster}.jpg`} alt={`3D reconstruction of ${sel.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </picture>
            <span className="font-hud absolute left-2 top-2 rounded-full border border-line/80 bg-void/70 px-2 py-0.5 text-[10px] text-starlight backdrop-blur-sm">3D reconstruction</span>
          </div>
          <div className="p-4">
            <p className="font-hud text-[11px] text-mute">
              {sel.catalogNo} · <span className={sel.active ? "text-starlight" : "text-ignite"}>{sel.status}</span>
            </p>
            <h3 className="font-display mt-1 text-xl">{sel.name}</h3>
            <p className="mt-0.5 text-sm text-mute">{sel.site}</p>

            <dl className="font-hud mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
              <dt className="text-mute">{sel.impact ? M.impact : M.landed}</dt>
              <dd className="text-text">{sel.landed}</dd>
              {sel.lastContact && (
                <>
                  <dt className="text-mute">{M.lastContact}</dt>
                  <dd className="text-text">{sel.lastContact}</dd>
                </>
              )}
              <dt className="text-mute">{M.coordinates}</dt>
              <dd className="text-text">{sel.lat !== undefined && sel.lon !== undefined ? fmtCoords(sel.lat, sel.lon) : M.notPublished}</dd>
            </dl>
            {sel.coordNote && <p className="mt-1 text-[11px] text-mute">{sel.coordNote}</p>}
            {sel.coordSource && <p className="mt-0.5 text-[11px] text-mute">{M.coordSource}: {sel.coordSource}</p>}

            <p className="font-hud mt-4 text-[10px] tracking-[0.2em] text-platinum">{M.young}</p>
            <p className="mt-1 text-sm leading-relaxed text-text">{sel.young}</p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link href={`/exhibit/${sel.slug}`} className="text-starlight hover:underline">{M.open}</Link>
              <Link href={`/journey#${sel.slug}`} className="text-mute hover:text-text">{M.journey}</Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
