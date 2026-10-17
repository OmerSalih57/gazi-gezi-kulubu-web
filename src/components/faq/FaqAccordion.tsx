"use client";

import { useState } from "react";
import type { FaqItem } from "@/data/faq";

export function FaqAccordion({
  items,
  title = "Sık sorulan sorular",
  intro,
}: {
  items: FaqItem[];
  title?: string;
  intro?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-zinc-50">{title}</h2>
        {intro && <p className="mt-1 text-sm text-neutral-500">{intro}</p>}
      </div>
      <div className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/80">
        {items.map((item) => {
          const open = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-button-${item.id}`;
          return (
            <div key={item.id}>
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-neutral-900 hover:bg-neutral-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <span>{item.question}</span>
                  <span aria-hidden className="text-lg text-orange-600">
                    {open ? "–" : "+"}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!open}
                className="px-5 pb-4 text-sm leading-relaxed text-neutral-600 dark:text-zinc-300"
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
