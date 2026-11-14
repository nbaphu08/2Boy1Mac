import { exhibitBySlug } from "@/content/exhibits";
import type { Beat } from "@/content/types";

const BASE = "/media/three/posters";
const PORTRAIT = "(orientation: portrait), (max-width: 767px)";

export function posterAlt(beat: Beat): string {
  if (beat.id === "hero") return "The Vehicle Assembly Building at Kennedy Space Center at sunrise (photograph)";
  const ex = beat.exhibitSlug ? exhibitBySlug(beat.exhibitSlug) : undefined;
  if (ex) return `3D reconstruction of ${ex.name}`;
  return `3D reconstruction of the scene: ${beat.title ?? beat.sub ?? beat.id}`;
}

/** Full-bleed still of the 3D scene for a beat; used in static (no-WebGL) mode. */
export function StaticPoster({ beat, eager }: { beat: Beat; eager: boolean }) {
  const id = beat.id;
  return (
    <div aria-hidden={false} className="absolute inset-0 overflow-hidden bg-void">
      <picture>
        <source media={PORTRAIT} type="image/avif" srcSet={`${BASE}/${id}-1080x1350.avif`} />
        <source media={PORTRAIT} type="image/jpeg" srcSet={`${BASE}/${id}-1080x1350.jpg`} />
        <source type="image/avif" srcSet={`${BASE}/${id}-1920x1080.avif`} />
        <img
          src={`${BASE}/${id}-1920x1080.jpg`}
          alt={posterAlt(beat)}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-void/40" />
    </div>
  );
}
