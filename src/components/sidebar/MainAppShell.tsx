"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  AppSidebar,
  type AppSidebarUser,
} from "@/components/sidebar/AppSidebar";
import { IconMenu } from "@/components/icons/NavIcons";
import {
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
} from "@/components/sidebar/sidebar-width";

const STORAGE_KEY = "smmplaner-sidebar-collapsed";

/** Совпадает с breakpoint `sm` в Tailwind (640px): ниже — «маленький экран». */
const NARROW_MAX_PX = 639;

/** Единый тайминг выезда панели, оверлея и бургера. */
const DRAWER_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DRAWER_MS = 360;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function useIsNarrowViewport() {
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(max-width: ${NARROW_MAX_PX}px)`);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return narrow;
}

export function MainAppShell({
  user,
  children,
}: {
  user: AppSidebarUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isNarrow = useIsNarrowViewport();
  const prefersReducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isNarrow) setMobileNavOpen(false);
  }, [isNarrow]);

  useEffect(() => {
    if (!isNarrow || !mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNarrow, mobileNavOpen]);

  useEffect(() => {
    if (!isNarrow || !mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isNarrow, mobileNavOpen]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const w = collapsed ? SIDEBAR_COLLAPSED_PX : SIDEBAR_EXPANDED_PX;

  const contentOffsetPx = isNarrow ? 0 : w;
  const contentWidthExpr = isNarrow ? "100%" : `calc(100% - ${w}px)`;

  useEffect(() => {
    document.documentElement.style.setProperty("--app-sidebar-width", `${w}px`);
    return () => {
      document.documentElement.style.setProperty(
        "--app-sidebar-width",
        `${SIDEBAR_EXPANDED_PX}px`
      );
    };
  }, [w]);

  return (
    <div className="min-h-dvh">
      {isNarrow ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          aria-hidden={!mobileNavOpen}
          tabIndex={mobileNavOpen ? 0 : -1}
          className={`fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--foreground)_35%,transparent)] backdrop-blur-[2px] transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            prefersReducedMotion ? "duration-75" : "duration-[360ms]"
          } ${
            mobileNavOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <AppSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        isNarrow={isNarrow}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
        drawerTransitionMs={DRAWER_MS}
        drawerTransitionEasing={DRAWER_EASE}
        prefersReducedMotion={prefersReducedMotion}
      />
      {isNarrow ? (
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-expanded={mobileNavOpen}
          aria-haspopup="true"
          aria-controls="app-sidebar"
          aria-label="Открыть меню"
          className={`fixed left-3 top-3 z-30 flex size-10 origin-center items-center justify-center rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] text-[var(--foreground)] shadow-sm ring-1 ring-[color-mix(in_srgb,var(--foreground)_6%,transparent)] backdrop-blur-sm transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none hover:bg-[var(--surface-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
            prefersReducedMotion ? "duration-75" : "duration-[360ms]"
          } ${
            mobileNavOpen
              ? "pointer-events-none scale-90 opacity-0 -translate-y-1"
              : "pointer-events-auto scale-100 opacity-100 translate-y-0"
          }`}
        >
          <IconMenu className="size-[22px]" />
        </button>
      ) : null}
      <div
        className={`box-border flex min-h-dvh min-w-0 flex-col px-5 transition-[margin-inline-start,width] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-75 sm:px-8 lg:px-10 ${
          prefersReducedMotion ? "duration-75" : "duration-[360ms]"
        } ${isNarrow && !mobileNavOpen ? "pt-12" : ""}`}
        style={{
          marginInlineStart: contentOffsetPx,
          width: contentWidthExpr,
        }}
      >
        {children}
      </div>
    </div>
  );
}
