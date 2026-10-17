"use client";

import { useState } from "react";
import type { BoardMember } from "@/data/board";

function monogram(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function BoardGrid({ members }: { members: BoardMember[] }) {
  const [openId, setOpenId] = useState<string | null>(members[0]?.id ?? null);

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const open = openId === member.id;
        const panelId = `board-panel-${member.id}`;
        return (
          <li key={member.id}>
            <article className={`h-full rounded-3xl border bg-white p-4 transition ${open ? "border-orange-300 shadow-sm" : "border-neutral-200"}`}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : member.id)}
                className="flex w-full items-center gap-4 text-left"
              >
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.image} alt="" className="size-16 rounded-2xl object-cover" />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-300 text-lg font-black text-white">
                    {monogram(member.title)}
                  </span>
                )}
                <span>
                  <span className="block text-sm font-bold text-neutral-900">{member.title}</span>
                  <span className="mt-1 block text-xs text-orange-700">{open ? "Görevi gizle" : "Görevi ve bağlantıları gör"}</span>
                </span>
              </button>
              <div id={panelId} hidden={!open} className="space-y-3 pt-4">
                <p className="text-sm leading-relaxed text-neutral-600">{member.duty}</p>
                <ul className="flex flex-wrap gap-2">
                  {member.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <a
                          href={link.href}
                          target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                          rel={link.href.startsWith("mailto:") ? undefined : "noreferrer"}
                          className="inline-flex rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-500">
                          {link.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
