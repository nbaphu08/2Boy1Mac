"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { beatIndexById } from "@/content/beats";

/** Old deep links (/#moon-apollo-11) now live on /journey. Hashes never reach the server, so redirect here. */
export function HashRedirect() {
  const router = useRouter();
  useEffect(() => {
    let id = "";
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    if (id && beatIndexById(id) >= 0) router.replace(`/journey#${id}`);
  }, [router]);
  return null;
}
