"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/header/LogoMark";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconDashboard,
  IconNewPost,
  IconPosts,
  IconUsers,
} from "@/components/icons/NavIcons";
import type { ReactNode } from "react";
import {
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
} from "@/components/sidebar/sidebar-width";

const ThemeToggle = dynamic(
  () =>
    import("@/components/theme/ThemeToggle").then((m) => ({
      default: m.ThemeToggle,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="mb-4 px-1" aria-hidden>
        <div className="mb-2 h-3 w-14 rounded bg-[var(--surface-elevated)]" />
        <div className="h-9 rounded-lg bg-[var(--surface-elevated)] ring-1 ring-[var(--border)]" />
      </div>
    ),
  },
);

const mainNav = [
  { href: "/", label: "Дашборд", Icon: IconDashboard },
  { href: "/clients", label: "Клиенты", Icon: IconUsers },
  { href: "/calendar", label: "Календарь", Icon: IconCalendar },
] as const;

const contentNav = [
  { href: "/posts/current", label: "Актуальные посты", Icon: IconPosts },
  { href: "/posts/new", label: "Новый пост", Icon: IconNewPost },
] as const;

function NavItem({
  href,
  active,
  icon,
  collapsed,
  children,
}: {
  href: string;
  active: boolean;
  collapsed: boolean;
  icon?: ReactNode;
  children: React.ReactNode;
}) {
  const labelText = typeof children === "string" ? children : undefined;
  return (
    <Link
      href={href}
      title={collapsed && labelText ? labelText : undefined}
      className={`flex items-center rounded-lg text-[14px] font-medium outline-offset-2 transition-[padding,gap] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        collapsed ? "justify-center gap-0 px-2 py-2.5" : "gap-2.5 px-3 py-2"
      } ${
        active
          ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
      }`}
    >
      {icon ? <span className="shrink-0 opacity-90">{icon}</span> : null}
      <span
        className={
          collapsed
            ? "sr-only"
            : "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap leading-snug"
        }
      >
        {children}
      </span>
    </Link>
  );
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Divider({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={`bg-[var(--border)] ${collapsed ? "mx-0 my-3 h-px" : "my-4 h-px"}`}
      aria-hidden
    />
  );
}

export type AppSidebarUser = {
  email: string | null;
  name?: string | null;
  image?: string | null;
};

export function AppSidebar({
  user,
  collapsed,
  onToggleCollapsed,
}: {
  user: AppSidebarUser;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const displayName =
    user.name?.trim() ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Пользователь";
  const subtitle = user.email ?? "—";
  const avatarUrl = user.image ?? null;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const accountActive = pathname === "/account";

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  return (
    <aside
      style={{ width: sidebarW }}
      className={`fixed left-0 top-0 z-40 flex h-dvh shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] pt-6 pb-5 transition-[width,padding] duration-300 ease-out ${
        collapsed ? "px-2" : "px-4"
      }`}
    >
      <Link
        href="/"
        title={collapsed ? "smmplaner — на главную" : undefined}
        className={`group flex items-center outline-offset-4 transition-opacity hover:opacity-90 focus-visible:opacity-90 ${
          collapsed ? "justify-center px-0" : "gap-3 px-2"
        }`}
      >
        <LogoMark />
        <span
          className={
            collapsed
              ? "sr-only"
              : "text-[15px] font-semibold tracking-wide text-[var(--foreground)]"
          }
        >
          smmplaner
        </span>
      </Link>

      <Divider collapsed={collapsed} />

      <nav className="flex flex-col gap-0.5" aria-label="Основное меню">
        {mainNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            collapsed={collapsed}
            active={isNavActive(pathname, item.href)}
            icon={<item.Icon className="size-5" />}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <Divider collapsed={collapsed} />

      <p
        className={
          collapsed
            ? "sr-only"
            : "mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]"
        }
      >
        Контент
      </p>
      <nav className="flex flex-col gap-0.5" aria-label="Контент">
        {contentNav.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            collapsed={collapsed}
            active={isNavActive(pathname, item.href)}
            icon={<item.Icon className="size-5" />}
          >
            {item.label}
          </NavItem>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={
            collapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"
          }
          className={`mb-3 flex w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] py-2 text-[var(--muted)] transition-[padding,gap,colors] duration-300 ease-out hover:bg-[var(--border)] hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            collapsed ? "justify-center px-0" : "justify-center gap-2 px-3"
          }`}
        >
          {collapsed ? (
            <IconChevronRight className="size-5 shrink-0" aria-hidden />
          ) : (
            <>
              <IconChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="text-[12px] font-medium" aria-hidden>
                Свернуть
              </span>
            </>
          )}
        </button>

        <ThemeToggle compact={collapsed} />

        <Link
          href="/account"
          title={collapsed ? `${displayName} · ${subtitle}` : undefined}
          className={`flex items-center rounded-xl py-2 outline-offset-2 transition-[padding,gap] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
            collapsed ? "justify-center px-0" : "gap-3 px-2"
          } ${
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
          <div
            className={
              collapsed
                ? "sr-only"
                : "min-w-0 flex-1 overflow-hidden text-ellipsis"
            }
          >
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
