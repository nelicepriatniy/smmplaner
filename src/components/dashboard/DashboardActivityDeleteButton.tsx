"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition, type MouseEvent } from "react";
import { deleteDashboardActivityAction } from "@/app/(main)/dashboard/actions";
import { useAppNotifications } from "@/components/notifications/AppNotifications";

export function DashboardActivityDeleteButton({
  activityId,
}: {
  activityId: string;
}) {
  const { toast, confirm } = useAppNotifications();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      void (async () => {
        const ok = await confirm({
          title: "Удалить событие",
          message: "Убрать эту запись из ленты активности на дашборде?",
          confirmLabel: "Удалить",
          danger: true,
        });
        if (!ok) return;
        startTransition(async () => {
          const res = await deleteDashboardActivityAction(activityId);
          if (!res.ok) {
            toast({ message: res.error, variant: "error" });
            return;
          }
          toast({ message: "Событие удалено", variant: "success" });
          router.refresh();
        });
      })();
    },
    [activityId, confirm, router, toast],
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-[color-mix(in_srgb,#c85858_92%,var(--foreground))] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label="Удалить событие из ленты"
    >
      {pending ? "…" : "Удалить"}
    </button>
  );
}
