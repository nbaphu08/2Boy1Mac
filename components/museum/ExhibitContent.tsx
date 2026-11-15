import type { Exhibit } from "@/content/types";
import { expedition, guide, legacy } from "@/content/guide";
import { site } from "@/content/site";
import { AgeCounter } from "@/components/ui/AgeCounter";
import { AudioGuide } from "./AudioGuide";
import { ModelViewer } from "./ModelViewer";
import { Plaque } from "./Plaque";
import { SourceList, SourceTag } from "./SourceList";
import { ThenNowSlider } from "./ThenNowSlider";

export function statusLabel(ex: Exhibit) {
  return ex.statusLabel ?? (ex.status === "still-active" ? "STILL ACTIVE" : "SILENT");
}

export function ageLabel(ex: Exhibit) {
  if (ex.catalogNo === "SM-L-005") return "SINCE IMPACT";
  return ex.hall === "moon" ? "ON THE MOON FOR" : "ON MARS FOR";
}

const X = site.exhibitExtras;

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-hud mt-8 mb-3 text-xs text-mute">{children}</h3>;
}

/** Media column: 3D viewer (when a model exists) + Then/Now. */
export function ExhibitMedia({ ex }: { ex: Exhibit }) {
  const { media } = ex;
  return (
    <div className="space-y-6">
      {media.model && <ModelViewer url={media.model} poster={media.fallbackImage} label={ex.name} />}
      {media.now ? (
        <ThenNowSlider then={media.then} now={media.now} label={ex.name} />
      ) : (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.then.src} alt={media.then.alt} className="w-full rounded-md border border-line" />
          <figcaption className="mt-2 text-xs text-mute">{media.then.alt} ({media.then.credit})</figcaption>
        </figure>
      )}
      {media.extra?.map((im) => (
        <figure key={im.src}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={im.src} alt={im.alt} className="w-full rounded-md border border-line" loading="lazy" />
          <figcaption className="mt-2 text-xs text-mute">
            {im.alt} <span className="text-mute">({im.credit})</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ExhibitText({ ex, headingId, autoAudio = false }: { ex: Exhibit; headingId: string; autoAudio?: boolean }) {
  const rows: { label: string; value: string; sourceId?: string }[] = [];
  rows.push({ label: "Site", value: ex.location.site });
  const { lat, lon, coordNote, coordSource } = ex.location;
  if (lat !== undefined && lon !== undefined) {
    const c = `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? "N" : "S"} ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? "E" : "W"}`;
    rows.push({ label: "Coordinates", value: `${c}${coordNote ? ` · ${coordNote}` : ""}${coordSource ? ` (${coordSource})` : ""}` });
  } else if (coordNote) {
    rows.push({ label: "Coordinates", value: `${coordNote}${coordSource ? ` (${coordSource})` : ""}` });
  }
  for (const s of ex.stats) rows.push({ label: s.label, value: s.value, sourceId: s.sourceId });

  return (
    <div>
      <p className="font-hud text-[11px] text-mute">
        {ex.catalogNo} · {ex.hall === "moon" ? "Hall I · The Moon" : "Hall II · Mars"} ·{" "}
        <span className={ex.status === "still-active" ? "text-starlight" : "text-ignite"}>{statusLabel(ex)}</span>
      </p>
      <h2 id={headingId} className="font-display mt-2 text-3xl text-text md:text-4xl">
        {ex.name}
      </h2>
      <p className="mt-1 text-sm text-mute">
        {ex.formalName} · {ex.agency}
      </p>
      <AudioGuide key={ex.slug} slug={ex.slug} auto={autoAudio} />

      <div className="mt-5 border-y border-line py-4">
        <AgeCounter since={ex.dates.landing} label={ageLabel(ex)} />
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="contents">
              <dt className="font-hud text-[11px] leading-6 text-mute">{r.label}</dt>
              <dd className="text-text">
                {r.value} {r.sourceId && <SourceTag id={r.sourceId} sources={ex.sources} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {guide[ex.slug] ? (
        <>
          <Heading>{expedition.questions.what}</Heading>
          <p className="text-text">{guide[ex.slug].what}</p>
        </>
      ) : null}

      <Heading>{expedition.questions.did}</Heading>
      <Plaque text={ex.plaque} />

      {ex.howItWorked && ex.howItWorked.length > 0 && (
        <>
          <Heading>{X.how}</Heading>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {ex.howItWorked.map((step, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden="true"
                  className={`font-hud absolute -left-[1.95rem] top-0 flex h-5 w-5 items-center justify-center rounded-full border bg-void text-[10px] ${
                    i === ex.howItWorked!.length - 1 ? "border-starlight text-starlight" : "border-line text-mute"
                  }`}
                >
                  {i + 1}
                </span>
                <p className="font-hud text-[11px] tracking-[0.15em] text-platinum">{step.label.toUpperCase()}</p>
                <p className="mt-1 text-text">
                  {step.text} <SourceTag id={step.sourceId} sources={ex.sources} />
                </p>
              </li>
            ))}
          </ol>
        </>
      )}

      {guide[ex.slug] ? (
        <>
          <Heading>{expedition.questions.why}</Heading>
          <p className="text-text">{guide[ex.slug].why}</p>
        </>
      ) : null}

      {legacy[ex.slug] ? (
        <>
          <Heading>{expedition.questions.taught}</Heading>
          <p className="text-text">{legacy[ex.slug]}</p>
        </>
      ) : null}

      <Heading>The story</Heading>
      <div className="space-y-3">
        {ex.story.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Heading>What it found</Heading>
      <ul className="list-disc space-y-1.5 pl-5 marker:text-starlight">
        {ex.discoveries.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>

      {ex.plotTwist && (
        <aside className="mt-6 rounded-md border border-ignite/50 bg-ignite/5 p-4">
          <p className="font-hud text-[11px] tracking-[0.15em] text-ignite">{X.twist}</p>
          <p className="font-display mt-1 text-lg text-text">{ex.plotTwist.title}</p>
          <p className="mt-2 text-sm text-text">
            {ex.plotTwist.text} <SourceTag id={ex.plotTwist.sourceId} sources={ex.sources} />
          </p>
        </aside>
      )}

      <Heading>Why it went silent</Heading>
      <p>{ex.whySilent}</p>

      <Heading>★ For young explorers</Heading>
      <p className="rounded-md border border-line bg-raised/50 p-4">{ex.youngExplorer}</p>

      {ex.eyes && (
        <>
          <Heading>{X.eyesTitle}</Heading>
          <a
            href={X.eyesUrl(ex.eyes.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-starlight/60 px-4 py-2 text-sm text-starlight transition-colors hover:bg-starlight/10"
          >
            {ex.eyes.label} <span aria-hidden="true">↗</span>
          </a>
          <p className="mt-2 text-xs text-mute">{X.eyesNote}</p>
        </>
      )}

      {ex.vitrine && (
        <>
          <Heading>{ex.vitrine.title}</Heading>
          <ul className="space-y-2 text-sm">
            {ex.vitrine.items.map((v, i) => (
              <li key={i}>
                <span className="text-text">{v.name}</span>
                {v.text && <span className="text-mute"> — {v.text}</span>} <SourceTag id={v.sourceId} sources={ex.sources} />
              </li>
            ))}
          </ul>
        </>
      )}

      {ex.curatorNotes && (
        <details className="mt-8 rounded-md border border-line p-3">
          <summary className="font-hud cursor-pointer text-xs text-mute">▸ Curator&apos;s notes</summary>
          <p className="mt-3 text-sm">{ex.curatorNotes}</p>
        </details>
      )}
      <details className="mt-3 rounded-md border border-line p-3">
        <summary className="font-hud cursor-pointer text-xs text-mute">▸ Sources ({ex.sources.length})</summary>
        <SourceList sources={ex.sources} className="mt-3" />
      </details>
    </div>
  );
}
