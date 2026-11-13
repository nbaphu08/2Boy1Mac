import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    title: `${ex.name} — SpaceMuse`,
    description: ex.plaque,
    openGraph: { title: `${ex.name} — SpaceMuse`, description: ex.plaque, images: [ex.media.then.src] },
  };
}

export default async function ExhibitPage({ params }: Props) {
  const { slug } = await params;
  const ex = exhibitBySlug(slug);
  if (!ex) notFound();
  const i = exhibits.indexOf(ex);
  const prev = exhibits[i - 1];
  const next = exhibits[i + 1];

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
      <nav className="mt-10 flex justify-between border-t border-line pt-4 text-sm">
        {prev ? <Link href={`/exhibit/${prev.slug}`} className="hover:text-starlight">← {prev.name}</Link> : <span />}
        {next ? <Link href={`/exhibit/${next.slug}`} className="hover:text-starlight">{next.name} →</Link> : <span />}
      </nav>
    </main>
  );
}
