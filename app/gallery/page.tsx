import type { Metadata } from "next";
import Link from "next/link";
import { exhibitsByHall } from "@/content/exhibits";
import { site } from "@/content/site";
import { statusLabel } from "@/components/museum/ExhibitContent";

export const metadata: Metadata = { title: "Gallery", description: `All twelve exhibits: ${site.tagline}`, alternates: { canonical: "/gallery" } };

export default function GalleryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <nav className="font-hud mb-8 flex justify-between text-[11px] text-mute">
        <Link href="/" className="hover:text-text">← {site.wordmark}</Link>
        <Link href="/about" className="hover:text-text">About &amp; Sources</Link>
      </nav>
      <h1 className="font-display text-3xl md:text-5xl">Gallery</h1>
      <p className="mt-2 text-mute">{site.tagline}</p>
      {(["moon", "mars"] as const).map((hall) => (
        <section key={hall} className="mt-12" aria-labelledby={`h-${hall}`}>
          <h2 id={`h-${hall}`} className="font-display text-xl">{site.halls[hall].name}</h2>
          <p className="mb-5 text-sm text-mute">{site.halls[hall].sub}</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exhibitsByHall(hall).map((ex) => (
              <li key={ex.slug}>
                <Link href={`/exhibit/${ex.slug}`} className="group block overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-platinum">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ex.media.then.src.replace("-1600.avif", "-800.avif")} alt={ex.media.then.alt} loading="lazy" className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="p-4">
                    <p className="font-hud text-[11px] text-mute">{ex.catalogNo} · <span className={ex.status === "still-active" ? "text-starlight" : "text-ignite"}>{statusLabel(ex)}</span></p>
                    <h3 className="font-display mt-1 text-lg">{ex.name}</h3>
                    <p className="mt-1 text-sm text-mute">{ex.location.site}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
