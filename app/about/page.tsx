import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { SOURCES } from "@/content/sources";
import { SourceList } from "@/components/museum/SourceList";

export const metadata: Metadata = { title: "About & Sources — SpaceMuse", description: site.about.body };

const allSources = () =>
  Object.values(SOURCES).sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1)));

export default function AboutPage() {
  const a = site.about;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:px-8">
      <nav className="font-hud mb-8 flex justify-between text-[11px] text-mute">
        <Link href="/" className="hover:text-text">← {site.wordmark}</Link>
        <Link href="/gallery" className="hover:text-text">Gallery</Link>
      </nav>
      <h1 className="font-display text-3xl md:text-5xl">{a.heading}</h1>
      <p className="mt-6">{a.body}</p>
      <h2 className="font-hud mt-10 mb-2 text-xs text-mute">Built for</h2>
      <p>{a.builtFor}</p>
      <h2 className="font-hud mt-10 mb-2 text-xs text-mute">Team</h2>
      <p>{a.team}</p>
      <h2 className="font-hud mt-10 mb-2 text-xs text-mute">AI disclosure</h2>
      <p>{a.ai}</p>
      <h2 className="font-hud mt-10 mb-2 text-xs text-mute">Data credits</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm marker:text-starlight">
        {a.credits.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <h2 className="font-hud mt-10 mb-3 text-xs text-mute">Sources</h2>
      <SourceList sources={allSources()} />
      <p className="mt-10 text-sm text-mute">{site.illustrative}</p>
      <p className="mt-3 text-sm text-mute">{site.disclaimer}</p>
    </main>
  );
}
