import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { beats } from "@/content/beats";
import { exhibits, exhibitBySlug } from "@/content/exhibits";
import { ExhibitMedia, ExhibitText } from "@/components/museum/ExhibitContent";
import { PageVisit } from "@/components/museum/PageVisit";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return exhibits.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ex = exhibitBySlug(slug);
  if (!ex) return {};
  return {
    title: ex.name,
    description: ex.plaque,
    alternates: { canonical: `/exhibit/${ex.slug}` },
    openGraph: { title: `${ex.name} — SpaceMuse`, description: ex.plaque, url: `/exhibit/${ex.slug}` },
    twitter: { card: "summary_large_image", title: `${ex.name} — SpaceMuse`, description: ex.plaque },
  };
}

export default async function ExhibitPage({ params }: Props) {
  const { slug } = await params;
  const ex = exhibitBySlug(slug);
  if (!ex) notFound();
  const i = exhibits.indexOf(ex);
  const prev = exhibits[i - 1];
  const next = exhibits[i + 1];
  const beatId = beats.find((b) => b.exhibitSlug === ex.slug)?.id;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-8">
      <PageVisit slug={ex.slug} />
      <nav className="font-hud mb-6 flex justify-between text-[11px] text-mute">
        <Link href="/gallery" className="hover:text-text">← Gallery</Link>
        <Link href="/" className="hover:text-text">SPACEMUSE</Link>
      </nav>
      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <ExhibitMedia ex={ex} />
        <article aria-labelledby="exhibit-title">
          <ExhibitText ex={ex} headingId="exhibit-title" />
        </article>
      </div>
      {beatId && (
        <p className="mt-8">
          <Link
            href={`/#${beatId}`}
            className="font-hud inline-block rounded border border-starlight/60 bg-raised/85 px-4 py-2 text-xs text-starlight transition-colors hover:bg-starlight hover:text-void"
          >
            View in the journey →
          </Link>
        </p>
      )}
      <nav className="mt-10 flex justify-between border-t border-line pt-4 text-sm">
        {prev ? <Link href={`/exhibit/${prev.slug}`} className="hover:text-starlight">← {prev.name}</Link> : <span />}
        {next ? <Link href={`/exhibit/${next.slug}`} className="hover:text-starlight">{next.name} →</Link> : <span />}
      </nav>
    </main>
  );
}
