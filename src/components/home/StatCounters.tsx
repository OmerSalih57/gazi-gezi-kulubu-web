"use client";

import { useEffect, useState } from "react";

function useCount(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function Stat({ value, label }: { value: number; label: string }) {
  const shown = useCount(value);
  return (
    <div>
      <div className="text-3xl font-black tracking-tight text-white sm:text-4xl">{shown}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/70">{label}</div>
    </div>
  );
}

export function StatCounters({
  trips,
  members,
  destinations,
}: {
  trips: number;
  members: number;
  destinations: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 border-t border-white/15 pt-6 sm:max-w-lg">
      <Stat value={trips} label="Gezi" />
      <Stat value={members} label="Aktif üye" />
      <Stat value={destinations} label="Rota" />
    </div>
  );
}
