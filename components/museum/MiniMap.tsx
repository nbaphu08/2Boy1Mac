"use client";

import { exhibitsByHall } from "@/content/exhibits";
import { expedition } from "@/content/guide";
import { useMuseum } from "@/lib/store";
import { MAP_VIEW } from "./StoryMap";

const T = expedition.minimap;

/** Compact equirectangular map of one body. Pins sit at each exhibit's real coordinates and fly to its beat on click. */
export function MiniMap({
  hall,
  currentSlug,
  onJump,
  large = false,
  chips = false,
}: {
  hall: "moon" | "mars";
  currentSlug: string | null;
  onJump: (slug: string) => void;
  large?: boolean;
  chips?: boolean;
}) {
  const visited = useMuseum((s) => s.visited);
  const v = MAP_VIEW[hall];
  const lonSpan = v.lon1 - v.lon0;
  const latSpan = v.lat1 - v.lat0;
  const list = exhibitsByHall(hall);
  const pinned = list.filter(
    (e) => e.location.lat !== undefined && e.location.lon !== undefined,
  );
  const unpinned = list.filter(
    (e) => e.location.lat === undefined || e.location.lon === undefined,
  );
  const x = (lon: number) => ((lon - v.lon0) / lonSpan) * 100;
  const y = (lat: number) => ((v.lat1 - lat) / latSpan) * 100;
  // current pin last so it stacks on top where pins overlap
  const ordered = [...pinned].sort(
    (a, b) => Number(a.slug === currentSlug) - Number(b.slug === currentSlug),
  );

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded border border-line/70 bg-void"
        style={{ aspectRatio: `${lonSpan} / ${latSpan}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${v.img}.webp`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-void/30"
        />
        {ordered.map((e) => {
          const on = e.slug === currentSlug;
          const done = visited.includes(e.slug);
          const px = x(e.location.lon as number);
          const py = y(e.location.lat as number);
          const tipSide =
            px < 30
              ? "left-0"
              : px > 70
                ? "right-0"
                : "left-1/2 -translate-x-1/2";
          return (
            <button
              key={e.slug}
              type="button"
              onClick={() => onJump(e.slug)}
              aria-label={`${T.jump(e.name)}, ${e.location.site}`}
              aria-current={on ? "true" : undefined}
              className={`group pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full outline-none ${
                large ? "h-11 w-11" : "h-8 w-8"
              } ${on ? "z-20" : "z-10 hover:z-30 focus-visible:z-30"}`}
              style={{ left: `${px}%`, top: `${py}%` }}
            >
              {on && (
                <span
                  aria-hidden
                  className="absolute h-4 w-4 rounded-full bg-starlight/60 motion-safe:animate-ping"
                />
              )}
              <span
                aria-hidden
                className={`relative block rounded-full border transition-transform group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-platinum ${
                  on
                    ? "h-3.5 w-3.5 border-text bg-starlight shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
                    : done
                      ? "h-2.5 w-2.5 border-platinum bg-platinum"
                      : "h-2.5 w-2.5 border-platinum bg-void/70"
                }`}
              />
              <span
                aria-hidden
                className={`font-hud pointer-events-none absolute bottom-full mb-0.5 hidden whitespace-nowrap rounded bg-void/90 px-1.5 py-0.5 text-[10px] text-text group-hover:block group-focus-visible:block ${tipSide}`}
              >
                {e.name}
              </span>
            </button>
          );
        })}
      </div>
      {(chips || unpinned.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {(chips ? list : unpinned).map((e) => {
            const on = e.slug === currentSlug;
            const nopin = e.location.lat === undefined;
            return (
              <li key={e.slug}>
                <button
                  type="button"
                  onClick={() => onJump(e.slug)}
                  aria-label={T.jump(e.name)}
                  title={
                    nopin ? `${e.location.site} · ${T.noPin}` : e.location.site
                  }
                  className={`font-hud pointer-events-auto flex min-h-8 cursor-pointer items-center rounded border px-2 text-[10px] ${large ? "min-h-11" : ""} ${
                    on
                      ? "border-starlight text-starlight"
                      : "border-line text-mute hover:text-text"
                  }`}
                >
                  {e.name}
                  {nopin ? " ·" : ""}
                  {nopin && <span className="ml-1 text-mute">{T.noPin}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
