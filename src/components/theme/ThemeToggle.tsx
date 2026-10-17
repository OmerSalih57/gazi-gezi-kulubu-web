"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const dark = ready && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "Aydınlık moda geç" : "Karanlık moda geç"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`relative grid size-9 place-items-center overflow-hidden rounded-full border shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-500 hover:shadow-[0_0_18px_rgba(245,158,11,0.35)] ${
        onDark
          ? "border-white/20 bg-white/10 text-zinc-100 backdrop-blur"
          : "border-zinc-200 bg-white/80 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-amber-100"
      }`}
    >
      <Sun
        className={`absolute size-4 transition duration-300 ${dark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        aria-hidden
      />
      <Moon
        className={`absolute size-4 transition duration-300 ${dark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`}
        aria-hidden
      />
    </button>
  );
}
