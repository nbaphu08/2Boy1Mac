"use client";

import { useSyncExternalStore } from "react";

// Client-only: SSR renders a skeleton so server and client markup always match.
function subscribe(cb: () => void) {
  const id = setInterval(cb, 60 * 60 * 1000); // updated daily; hourly check is plenty
  return () => clearInterval(id);
}
const today = () => new Date().toISOString().slice(0, 10);

export function diffYMD(fromIso: string, toIso: string) {
  const [fy, fm, fd] = fromIso.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  let y = ty - fy;
  let m = tm - fm;
  let d = td - (fd || 1);
  if (d < 0) {
    m -= 1;
    d += new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();
  }
  if (m < 0) {
    y -= 1;
    m += 12;
  }
  return { y, m, d };
}

export function AgeCounter({ since, label }: { since: string; label: string }) {
  const now = useSyncExternalStore(subscribe, today, () => "");
  const age = now ? diffYMD(since, now) : null;
  return (
    <div className="font-hud text-[11px] text-mute" aria-live="off">
      <div>{label}</div>
      {age ? (
        <div className="mt-1 text-xl text-starlight normal-case tracking-normal" aria-label={`${age.y} years, ${age.m} months, ${age.d} days`}>
          {age.y}y {age.m}m {age.d}d
        </div>
      ) : (
        <div className="mt-1 h-7 w-40 animate-pulse rounded bg-raised" aria-hidden />
      )}
    </div>
  );
}
