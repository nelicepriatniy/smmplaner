"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addDiscussionByTokenAction } from "@/app/review/actions";
import type { PostReviewComment } from "@/components/posts/postReviewTypes";
import {
  formatTimeAgoRuFrom,
} from "@/components/posts/postReviewUtils";

type ClientPortalDiscussionProps = {
  clientReviewToken: string;
  initialComments: PostReviewComment[];
  refMs: number;
};

function portalAuthorLabel(side: PostReviewComment["side"]) {
  return side === "self" ? "Аня" : "Вы";
}

function formatMessageTime(c: PostReviewComment, refMs: number) {
  return formatTimeAgoRuFrom(c.createdAt, refMs);
}

export function ClientPortalDiscussion({
  clientReviewToken,
  initialComments,
  refMs,
}: ClientPortalDiscussionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const messages = useMemo(
    () => [...initialComments].sort((a, b) => a.createdAt - b.createdAt),
    [initialComments]
  );

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setError("");
    startTransition(async () => {
      const res = await addDiscussionByTokenAction(clientReviewToken, text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }, [clientReviewToken, draft, router]);

  return (
    <div className="mt-8 flex min-h-[280px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div
        className="max-h-[min(48vh,480px)] flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
        role="log"
        aria-label="Обсуждение"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[var(--muted)]">
            Пока нет сообщений — напишите команде ниже.
          </p>
        ) : (
          messages.map((c) => {
            const fromSmm = c.side === "self";
            return (
              <div
                key={c.id}
                className={`flex max-w-[min(100%,28rem)] flex-col gap-1 ${fromSmm ? "mr-auto items-start" : "ml-auto items-end text-right"}`}
              >
                <p className="text-[12px] text-[var(--muted)]">
                  <span className="font-medium text-[var(--foreground)]">
                    {portalAuthorLabel(c.side)}
                  </span>
                  <span aria-hidden> · </span>
                  <time dateTime={new Date(c.createdAt).toISOString()}>
                    {formatMessageTime(c, refMs)}
                  </time>
                </p>
                <p
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    fromSmm
                      ? "bg-[var(--surface-elevated)] text-[var(--foreground)] ring-1 ring-[var(--border)]"
                      : "bg-[var(--accent-soft)] text-[var(--foreground)]"
                  }`}
                >
                  {c.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-[var(--border)] p-4 sm:p-5">
        {error ? (
          <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[12px] text-rose-100">
            {error}
          </p>
        ) : null}
        <label htmlFor="client-portal-reply" className="sr-only">
          Ваше сообщение
        </label>
        <textarea
          id="client-portal-reply"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Сообщение команде…"
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || isPending}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "Отправка…" : "Отправить"}
          </button>
        </div>
        <p className="mt-2 text-[12px] text-[var(--muted)]">
          Сообщения сохраняются и передаются SMM в панели поста.
          <span className="max-sm:hidden"> Ctrl+Enter — отправить.</span>
        </p>
      </div>
    </div>
  );
}
