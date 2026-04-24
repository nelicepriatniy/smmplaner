"use client";

import { IconMoon, IconSun } from "@/components/icons/NavIcons";
import { useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "smmplaner-theme";

function readThemeFromDom(): Theme {
  if (typeof document === "undefined") return "dark";
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>(readThemeFromDom);

  if (compact) {
    return (
      <div
        className="mb-3 flex flex-col gap-1 px-0.5"
        role="group"
        aria-label="Тема оформления"
      >
        {(
          [
            { id: "light" as const, label: "Светлая тема", Icon: IconSun },
            { id: "dark" as const, label: "Тёмная тема", Icon: IconMoon },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTheme(id);
                applyTheme(id);
              }}
              aria-label={label}
              aria-pressed={active}
              className={`flex h-10 w-full shrink-0 items-center justify-center rounded-lg transition-colors outline-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                active
                  ? "bg-[var(--accent-soft)] text-[var(--foreground)] ring-1 ring-[var(--border)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="size-5 shrink-0" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="mb-4 px-1"
      role="group"
      aria-label="Тема оформления"
    >
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        Тема
      </p>
      <div className="flex rounded-lg bg-[var(--surface-elevated)] p-0.5 ring-1 ring-[var(--border)]">
        {(
          [
            { id: "light" as const, label: "Светлая" },
            { id: "dark" as const, label: "Тёмная" },
          ] as const
        ).map(({ id, label }) => {
          const active = theme === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTheme(id);
                applyTheme(id);
              }}
              className={`relative flex-1 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors outline-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                active
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
