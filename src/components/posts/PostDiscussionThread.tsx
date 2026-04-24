"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addPostDiscussionCommentAction } from "@/app/(main)/posts/actions";
import type { PostReviewComment } from "@/components/posts/postReviewTypes";
import {
  formatTimeAgoRuFrom,
} from "@/components/posts/postReviewUtils";
import { discussionAuthorLabel } from "@/domain/smm";

type PostDiscussionThreadProps = {
  postId: string;
  initialComments: PostReviewComment[];
  refMs: number;
};

function formatMessageTime(c: PostReviewComment, refMs: number) {
  return formatTimeAgoRuFrom(c.createdAt, refMs);
}

export function PostDiscussionThread({
  postId,
  initialComments,
  refMs,
}: PostDiscussionThreadProps) {
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
      const res = await addPostDiscussionCommentAction(postId, text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }, [draft, postId, router]);

  return (
    <div className="mt-8 flex min-h-[320px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div
        className="max-h-[min(52vh,520px)] flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
        role="log"
        aria-label="Переписка"
      >
        {messages.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-[var(--muted)]">
            Пока нет сообщений — напишите клиенту ниже.
          </p>
        ) : (
          messages.map((c) => {
            const mine = c.side === "self";
            return (
              <div
                key={c.id}
                className={`flex max-w-[min(100%,28rem)] flex-col gap-1 ${mine ? "ml-auto items-end text-right" : "mr-auto items-start"}`}
              >
                <p className="text-[12px] text-[var(--muted)]">
                  <span className="font-medium text-[var(--foreground)]">
                    {discussionAuthorLabel(c.side)}
                  </span>
                  <span aria-hidden> · </span>
                  <time dateTime={new Date(c.createdAt).toISOString()}>
                    {formatMessageTime(c, refMs)}
                  </time>
                </p>
                <p
                  className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    mine
                      ? "bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "bg-[var(--surface-elevated)] text-[var(--foreground)] ring-1 ring-[var(--border)]"
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
        <label htmlFor="discussion-reply" className="sr-only">
          Ваше сообщение клиенту
        </label>
        <textarea
          id="discussion-reply"
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Сообщение клиенту…"
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
          Сообщения сохраняются в базе и видны клиенту по ссылке согласования.
          <span className="max-sm:hidden"> Ctrl+Enter — отправить.</span>
        </p>
      </div>
    </div>
  );
}
