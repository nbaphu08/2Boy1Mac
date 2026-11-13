import type { SourceRef } from "@/content/types";

export function SourceList({ sources, className = "" }: { sources: SourceRef[]; className?: string }) {
  return (
    <ol className={`space-y-1.5 text-sm ${className}`}>
      {sources.map((s) => (
        <li key={s.id} className="flex gap-3">
          <span className="font-hud w-9 shrink-0 text-[11px] text-mute">{s.id}</span>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-starlight underline-offset-2 hover:underline">
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function SourceTag({ id, sources }: { id: string; sources: SourceRef[] }) {
  const s = sources.find((x) => x.id === id);
  if (!s) return <span className="font-hud text-[10px] text-mute">{id}</span>;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      title={s.title}
      aria-label={`Source ${s.id}: ${s.title}`}
      className="font-hud text-[10px] text-mute underline-offset-2 hover:text-starlight hover:underline"
    >
      {s.id}
    </a>
  );
}
