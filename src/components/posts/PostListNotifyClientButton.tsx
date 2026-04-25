"use client";

import { useCallback, useTransition } from "react";
import { notifyClientAboutPostAction } from "@/app/(main)/posts/actions";
import { useAppNotifications } from "@/components/notifications/AppNotifications";

export function PostListNotifyClientButton({ postId }: { postId: string }) {
  const { toast } = useAppNotifications();
  const [pending, startTransition] = useTransition();

  const onClick = useCallback(() => {
    startTransition(async () => {
      const res = await notifyClientAboutPostAction(postId);
      if (!res.ok) {
        toast({ message: res.error, variant: "error" });
        return;
      }
      toast({
        message: "Сообщение с ссылкой отправлено клиенту в Telegram",
        variant: "success",
      });
    });
  }, [postId, toast]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-[13px] font-medium text-[var(--accent)] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Отправка…" : "Уведомить клиента"}
    </button>
  );
}
