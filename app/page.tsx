import Link from "next/link";
import { journey } from "@/content/journey";
import { beats } from "@/content/beats";
import { site } from "@/content/site";
import { Reveal } from "@/components/landing/Reveal";
import { HashRedirect } from "@/components/landing/HashRedirect";

const hero = beats[0];
const L = site.landing;

function VisitCta({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/journey"
      className={`cta-visit group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-platinum/70 bg-void/55 px-8 py-3 text-sm text-white shadow-[0_0_0_1px_rgba(157,184,255,0.0),0_10px_40px_-10px_rgba(157,184,255,0.35)] backdrop-blur-md transition-all duration-300 hover:border-starlight hover:bg-starlight hover:text-void focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-starlight sm:text-[15px] ${className}`}
    >
      {L.cta}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        &rarr;
      </span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="landing-root relative w-full bg-void">
      <HashRedirect />

      <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-3 py-3 sm:px-10 sm:py-4">
        <Link
          href="/"
          className="font-display rounded-full border border-line/80 bg-surface/65 px-3.5 py-2 text-xs tracking-widest text-text backdrop-blur-md hover:text-starlight"
        >
          {site.wordmark}
        </Link>
        <nav
          aria-label={journey.ui.navLabel}
          className="font-hud flex items-center gap-4 rounded-full border border-line/80 bg-surface/65 px-4 py-2 text-[10px] backdrop-blur-md"
        >
          <Link href="/journey" className="text-text transition-colors hover:text-starlight">
            Journey
          </Link>
          <Link href="/collection" className="text-text transition-colors hover:text-starlight">
            Collection
          </Link>
          <Link href="/about" className="text-mute transition-colors hover:text-text">
            {journey.ui.about}
          </Link>
        </nav>
      </header>

      {/* Section 1 — hero */}
      <section className="relative flex min-h-dvh w-full flex-col overflow-hidden" aria-labelledby="hero-title">
        <picture>
          <source
            type="image/avif"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.avif 1280w, /media/images/hero_vab_sunrise_alt-2560.avif 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/media/images/hero_vab_sunrise_alt-1280.jpg 1280w, /media/images/hero_vab_sunrise_alt-2560.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/media/images/hero_vab_sunrise_alt-2560.jpg"
            alt="The Vehicle Assembly Building at Kennedy Space Center at sunrise (photograph)"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.94] contrast-[1.04]"
          />
        </picture>
        <div aria-hidden className="fog fog-a" style={{ top: "30%", height: "40%" }} />
        <div aria-hidden className="fog fog-b" style={{ top: "55%", height: "35%" }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-void/50" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 62% 46% at 50% 38%, rgba(6, 9, 16, 0.66) 0%, rgba(6, 9, 16, 0.36) 56%, transparent 86%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 vignette" />

        <div className="font-hud text-shadow-copy relative z-10 flex flex-wrap items-center justify-center gap-3 px-4 pt-20 text-center text-[11px] text-platinum sm:justify-end sm:px-12 sm:pt-24 sm:text-right">
          <span>{hero.sub}</span>
          <span className="text-line">·</span>
          <span className="text-starlight">{journey.hero.location}</span>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 py-10 text-center">
          <h1
            id="hero-title"
            className="font-display text-shadow-display text-[clamp(2.4rem,8vw,6.4rem)] leading-none text-white"
          >
            {hero.title}
          </h1>
          <p className="text-shadow-copy mt-4 max-w-[28ch] text-lg font-medium text-white/95 sm:max-w-none sm:text-xl">
            {hero.caption}
          </p>
          <VisitCta className="mt-8" />
        </div>

        <div className="text-shadow-copy relative z-10 flex flex-col items-center gap-3 px-4 pb-8 text-center sm:flex-row sm:items-end sm:justify-between sm:px-12 sm:pb-10 sm:text-left">
          <p className="font-hud text-[11px] text-platinum">{journey.hero.admission}</p>
          <a
            href="#about"
            className="font-hud min-h-11 content-center text-xs text-starlight transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-starlight"
          >
            {L.scrollHint}
          </a>
        </div>
      </section>

      {/* Section 2 — about the gallery */}
      <section
        id="about"
        aria-labelledby="about-heading"
        className="relative border-t border-line/60 bg-void px-4 py-20 sm:px-10 sm:py-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-surface/60 to-transparent"
        />
        <div className="relative mx-auto max-w-5xl">
          <Reveal>
            <p className="font-hud text-[11px] text-starlight">{L.eyebrow}</p>
            <h2
              id="about-heading"
              className="font-display mt-4 max-w-3xl text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.08] text-white"
            >
              {L.heading}
            </h2>
          </Reveal>

          <Reveal delay={80} className="mt-8 grid max-w-3xl gap-5 text-[17px] leading-relaxed text-platinum">
            {L.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>

          <div className="mt-16 grid gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
            <Reveal>
              <h3 className="font-hud text-[11px] text-platinum">{L.routeTitle}</h3>
              <ol className="relative mt-6 border-l border-line">
                {L.route.map((stop, i) => (
                  <li key={stop.name} className="relative pb-8 pl-8 last:pb-0">
                    <span
                      aria-hidden
                      className="font-hud absolute -left-[15px] top-0 grid h-[30px] w-[30px] place-items-center rounded-full border border-platinum/60 bg-void text-[10px] text-starlight"
                    >
                      {i + 1}
                    </span>
                    <p className="font-display text-base text-white sm:text-lg">{stop.name}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-mute">{stop.text}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={120}>
              <h3 className="font-hud text-[11px] text-platinum">{L.howTitle}</h3>
              <ul className="mt-6 grid gap-4">
                {L.how.map((h, i) => (
                  <li
                    key={h}
                    className="flex gap-4 rounded-lg border border-line bg-surface/70 p-4 text-[15px] leading-relaxed text-text"
                  >
                    <span aria-hidden className="font-hud pt-0.5 text-[11px] text-starlight">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal className="mt-16 flex flex-col items-start gap-6 border-t border-line/60 pt-10">
            <p className="font-hud text-[11px] normal-case tracking-normal text-mute">{site.illustrative}</p>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <VisitCta />
              <div className="font-hud flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                <Link
                  href="/collection"
                  className="inline-flex min-h-11 items-center border-b border-transparent text-text transition-colors hover:text-starlight focus-visible:outline-2 focus-visible:outline-starlight"
                >
                  {L.secondary.collection}
                </Link>
                <Link
                  href="/about"
                  className="inline-flex min-h-11 items-center text-mute transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-starlight"
                >
                  {L.secondary.about}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
