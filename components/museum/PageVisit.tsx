"use client";

import { useEffect } from "react";
import { useMuseum } from "@/lib/store";

/** Stamps the passport when an exhibit page is viewed directly. */
export function PageVisit({ slug }: { slug: string }) {
  useEffect(() => {
    const s = useMuseum.getState();
    s.hydrateVisited();
    s.markVisited(slug);
  }, [slug]);
  return null;
}
