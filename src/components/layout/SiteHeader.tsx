"use client";

import { BrandMark, GlowNav, HeaderToneProvider, headerShellClass, useScrolled } from "@/components/layout/header-motion";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const LINKS = [
  { href: "/geziler", label: "Geziler" },
  { href: "/blog", label: "Rehberler" },
  { href: "/galeri", label: "Galeri" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/yarisma", label: "Yarışma" },
];

export function SiteHeader({
  floating = false,
  children,
}: {
  floating?: boolean;
  children?: React.ReactNode;
}) {
  const scrolled = useScrolled();
  const onDark = floating && !scrolled;

  return (
    <header className={headerShellClass(scrolled, floating)}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <BrandMark onDark={onDark} />
        <div className="order-3 flex w-full max-w-full justify-center overflow-x-auto overflow-y-hidden py-0.5 [scrollbar-width:none] md:order-none md:w-auto [&::-webkit-scrollbar]:hidden">
          <GlowNav links={LINKS} onDark={onDark} />
        </div>
        <HeaderToneProvider tone={onDark ? "onDark" : "light"}>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
            <ThemeToggle onDark={onDark} />
            {children}
          </div>
        </HeaderToneProvider>
      </div>
    </header>
  );
}
