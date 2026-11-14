import type { Exhibit } from "@/content/types";
import { AgeCounter } from "@/components/ui/AgeCounter";
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

export function ExhibitText({ ex, headingId }: { ex: Exhibit; headingId: string }) {
  const rows: { label: string; value: string; sourceId?: string }[] = [];
  rows.push({ label: "Site", value: ex.location.site });
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

      <Plaque text={ex.plaque} className="mt-6" />

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

      <Heading>Why it went silent</Heading>
      <p>{ex.whySilent}</p>

      <Heading>★ For young explorers</Heading>
      <p className="rounded-md border border-line bg-raised/50 p-4">{ex.youngExplorer}</p>

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
