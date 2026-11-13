import type { Exhibit } from "@/content/types";

export function Plaque({ text, className = "" }: { text: Exhibit["plaque"]; className?: string }) {
  return (
    <blockquote
      className={`border border-platinum/40 bg-raised/60 p-5 text-[15px] leading-relaxed text-text shadow-[inset_0_0_0_3px_var(--surface),inset_0_0_0_4px_rgba(199,205,216,0.25)] ${className}`}
    >
      {text}
    </blockquote>
  );
}
