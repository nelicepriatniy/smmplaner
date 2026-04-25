"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { deletePostAction } from "@/app/(main)/posts/actions";
import { useAppNotifications } from "@/components/notifications/AppNotifications";
import type { PostDraftStatus } from "@/domain/smm";

export function PostListDeleteButton({
  postId,
  status,
}: {
  postId: string;
  status: PostDraftStatus;
}) {
  const { toast, confirm } = useAppNotifications();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = useCallback(() => {
    void (async () => {
      const message =
        status === "published"
          ? "Удалить этот пост из приложения? Публикация в соцсети при этом не удаляется. Действие необратимо."
          : "Удалить этот пост? Действие необратимо.";
      const ok = await confirm({
        title: "Удалить пост",
        message,
        confirmLabel: "Удалить",
        danger: true,
      });
      if (!ok) return;
      startTransition(async () => {
        const res = await deletePostAction(postId);
        if (!res.ok) {
          toast({ message: res.error, variant: "error" });
          return;
        }
        toast({ message: "Пост удалён", variant: "success" });
        router.refresh();
      });
    })();
  }, [confirm, postId, router, status, toast]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[13px] font-medium text-[color-mix(in_srgb,#c85858_92%,var(--foreground))] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Удаление…" : "Удалить"}
    </button>
  );
}
