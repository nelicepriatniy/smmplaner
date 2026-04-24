"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/header/LogoMark";

const mainNav = [
  { href: "/", label: "Дашборд" },
  { href: "/clients", label: "Клиенты" },
  { href: "/calendar", label: "Календарь" },
] as const;

const contentNav = [
  { href: "/posts/current", label: "Актуальные посты" },
  { href: "/posts/new", label: "Новый пост" },
] as const;

function NavItem({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-[14px] font-medium transition-colors outline-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </Link>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Divider() {
  return <div className="my-4 h-px bg-[var(--border)]" aria-hidden />;
}

export type AppSidebarUser = {
  email: string | null;
  name?: string | null;
  image?: string | null;
};

export function AppSidebar({ user }: { user: AppSidebarUser }) {
  const pathname = usePathname();
  const displayName =
    user.name?.trim() ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Пользователь";
  const subtitle = user.email ?? "—";
  const avatarUrl = user.image ?? null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const accountActive = pathname === "/account";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-[260px] shrink-0 flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] px-4 pb-5 pt-6">
      <Link
        href="/"
        className="group flex items-center gap-3 px-2 outline-offset-4 transition-opacity hover:opacity-90 focus-visible:opacity-90"
      >
        <LogoMark />
        <span className="text-[15px] font-semibold tracking-wide text-[var(--foreground)]">
          smmplaner
        </span>
      </Link>

      <Divider />

      <nav className="flex flex-col gap-0.5" aria-label="Основное меню">
        {mainNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            active={isNavActive(pathname, item.href)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <Divider />

      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        Контент
      </p>
      <nav className="flex flex-col gap-0.5" aria-label="Контент">
        {contentNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            active={isNavActive(pathname, item.href)}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] pt-5">
        <Link
          href="/account"
          className={`flex items-center gap-3 rounded-xl px-2 py-2 outline-offset-2 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            accountActive
              ? "bg-[var(--accent-soft)]"
              : "hover:bg-[var(--surface-elevated)]"
          }`}
          aria-current={accountActive ? "page" : undefined}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[15px] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent-soft)]"
              aria-hidden
            >
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[var(--foreground)]">
              {displayName}
            </p>
            <p className="truncate text-[12px] text-[var(--muted)]">{subtitle}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
