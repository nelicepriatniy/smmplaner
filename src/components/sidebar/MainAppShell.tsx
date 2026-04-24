"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  AppSidebar,
  type AppSidebarUser,
} from "@/components/sidebar/AppSidebar";
import {
  SIDEBAR_COLLAPSED_PX,
  SIDEBAR_EXPANDED_PX,
} from "@/components/sidebar/sidebar-width";

const STORAGE_KEY = "smmplaner-sidebar-collapsed";

export function MainAppShell({
  user,
  children,
}: {
  user: AppSidebarUser;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

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
      <AppSidebar
        user={user}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />
      <div
        className="box-border flex min-h-dvh min-w-0 flex-col px-5 transition-[margin-inline-start,width] duration-300 ease-out sm:px-8 lg:px-10"
        style={{
          marginInlineStart: w,
          width: `calc(100% - ${w}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
