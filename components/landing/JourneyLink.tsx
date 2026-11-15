"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { unlockAudio } from "@/lib/audioGuide";

/** Link to /journey that unlocks audio synchronously in the click (keeps user activation for the audio tour). */
export function JourneyLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      {...props}
      href="/journey"
      onClick={(e) => {
        unlockAudio();
        props.onClick?.(e);
      }}
    />
  );
}
