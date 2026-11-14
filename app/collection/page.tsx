import type { Metadata } from "next";
import Link from "next/link";
import { exhibitsByHall } from "@/content/exhibits";
import { site } from "@/content/site";
import { statusLabel } from "@/components/museum/ExhibitContent";

export const metadata: Metadata = { title: "Collection", description: `All twelve exhibits: ${site.tagline}`, alternates: { canonical: "/collection" } };

export default function CollectionPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-8">
      <nav className="font-hud mb-8 flex justify-between text-[11px] text-mute">
        <Link href="/" className="hover:text-text">← {site.wordmark}</Link>
        <Link href="/about" className="hover:text-text">About &amp; Sources</Link>
      </nav>
      <h1 className="font-display text-3xl md:text-5xl">Collection</h1>
      <p className="mt-2 text-mute">{site.tagline}</p>
      {(["moon", "mars"] as const).map((hall) => (
        <section key={hall} className="mt-12" aria-labelledby={`h-${hall}`}>
          <h2 id={`h-${hall}`} className="font-display text-xl">{site.halls[hall].name}</h2>
          <p className="mb-5 text-sm text-mute">{site.halls[hall].sub}</p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exhibitsByHall(hall).map((ex) => (
              <li key={ex.slug}>
                <Link href={`/exhibit/${ex.slug}`} className="group block overflow-hidden rounded-md border border-line bg-surface transition-colors hover:border-platinum">
                  <div className="relative aspect-[3/2] w-full overflow-hidden">
                    <picture>
                      <source type="image/avif" srcSet={`/media/three/posters/${ex.slug}-1920x1080.avif`} />
                      <img
                        src={`/media/three/posters/${ex.slug}-1920x1080.jpg`}
                        alt={`3D reconstruction of ${ex.name}`}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0"
                      />
                    </picture>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.media.then.src.replace("-1600.avif", "-800.avif")}
                      alt={ex.media.then.alt}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                    />
                    <span className="font-hud absolute left-2 top-2 rounded-full border border-line/80 bg-void/70 px-2 py-0.5 text-[10px] text-starlight backdrop-blur-sm group-hover:hidden group-focus-visible:hidden">3D reconstruction</span>
                    <span className="font-hud absolute left-2 top-2 hidden rounded-full border border-line/80 bg-void/70 px-2 py-0.5 text-[10px] text-platinum backdrop-blur-sm group-hover:inline group-focus-visible:inline">Archive photo</span>
                  </div>
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
