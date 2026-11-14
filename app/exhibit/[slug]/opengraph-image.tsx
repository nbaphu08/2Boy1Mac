import { notFound } from "next/navigation";
import { exhibitBySlug, exhibits } from "@/content/exhibits";
import { renderOg, ogSize } from "@/lib/og";

export const alt = "SpaceMuse exhibit";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return exhibits.map((e) => ({ slug: e.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ex = exhibitBySlug(slug);
  if (!ex) notFound();
  return renderOg({
    kicker: `${ex.catalogNo} · ${ex.hall === "moon" ? "HALL I — THE MOON" : "HALL II — MARS"}`,
    title: ex.name,
    sub: ex.location.site,
    thenSrc: ex.media.then.src,
  });
}
