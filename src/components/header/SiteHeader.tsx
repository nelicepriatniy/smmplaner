import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
        <Link
          href="/"
          className="group flex items-center gap-3 outline-offset-4 transition-opacity hover:opacity-90 focus-visible:opacity-90"
        >
          <LogoMark />
          <span className="text-[15px] font-medium tracking-wide text-[var(--foreground)]">
            smmplaner
          </span>
        </Link>
      </div>
    </header>
  );
}
