"use client";

import { useCallback, useId, useState, type FormEvent } from "react";
import {
  type PostReviewComment,
  type PostWorkflowStatus,
  POST_STATUS_OPTIONS,
} from "./postReviewTypes";
import { formatTimeAgoRu } from "./postReviewUtils";

type PostReviewPanelProps = {
  managerName: string;
  clientName: string;
  status: PostWorkflowStatus;
  onStatusChange: (s: PostWorkflowStatus) => void;
  /** значение для input type="datetime-local" */
  publishAtValue: string;
  onPublishAtChange: (isoLocal: string) => void;
  comments: PostReviewComment[];
  onAddComment: (text: string, as: "self" | "client") => void;
};

export function PostReviewPanel({
  managerName,
  clientName,
  status,
  onStatusChange,
  publishAtValue,
  onPublishAtChange,
  comments,
  onAddComment,
}: PostReviewPanelProps) {
  const formId = useId();
  const [draft, setDraft] = useState("");
  const [as, setAs] = useState<"self" | "client">("self");

  const submit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const t = draft.trim();
      if (!t) return;
      onAddComment(t, as);
      setDraft("");
    },
    [draft, as, onAddComment]
  );

  return (
    <div className="mt-8 w-full min-w-0 max-w-md space-y-5">
      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Статус и публикация
        </h3>
        <div className="mt-3 space-y-3">
          <div>
            <label
              htmlFor={`${formId}-status`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Статус
            </label>
            <select
              id={`${formId}-status`}
              className="mt-2 w-full"
              value={status}
              onChange={(e) => onStatusChange(e.target.value as PostWorkflowStatus)}
            >
              {POST_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor={`${formId}-when`}
              className="text-[14px] font-medium text-[var(--foreground)]"
            >
              Дата и время выкладывания
            </label>
            <input
              id={`${formId}-when`}
              type="datetime-local"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
              value={publishAtValue}
              onChange={(e) => onPublishAtChange(e.target.value)}
            />
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              Когда тянуть в Instagram / напоминание
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Обсуждение с клиентом
        </h3>
        <ul
          className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/5 p-3 pl-0"
          aria-label="Сообщения"
        >
          {comments
            .slice()
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((c) => (
              <li key={c.id} className="pl-2">
                <p className="text-[12px] text-[var(--muted)]">
                  {c.side === "self" ? (
                    <>
                      {managerName}
                      <span className="text-[var(--foreground)]/80"> (вы)</span>
                    </>
                  ) : (
                    "Клиент"
                  )}
                  <span className="text-[var(--muted)]"> · </span>
                  <span className="tabular-nums text-[12px] text-[var(--muted)]">
                    {formatTimeAgoRu(c.createdAt)}
                  </span>
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--foreground)]">
                  {c.text}
                </p>
              </li>
            ))}
        </ul>

        <form onSubmit={submit} className="mt-3 space-y-2">
          <label htmlFor={`${formId}-msg`} className="sr-only">
            Новый комментарий
          </label>
          <textarea
            id={`${formId}-msg`}
            rows={2}
            placeholder="Написать комментарий…"
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-[15px] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-offset-2 focus:border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] focus:ring-2 focus:ring-[var(--accent-soft)]"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <p className="w-full min-w-0 text-[12px] text-[var(--muted)]">
              Как:{" "}
            </p>
            <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
              <button
                type="button"
                onClick={() => setAs("self")}
                className={
                  "rounded-md px-2.5 py-1 text-[12px] font-medium " +
                  (as === "self"
                    ? "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "text-[var(--muted)]")
                }
              >
                {managerName.split(" ")[0] ?? "Вы"} (вы)
              </button>
              <button
                type="button"
                onClick={() => setAs("client")}
                className={
                  "rounded-md px-2.5 py-1 text-[12px] font-medium " +
                  (as === "client"
                    ? "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    : "text-[var(--muted)]")
                }
              >
                Клиент ({clientName || "клиент"})
              </button>
            </div>
            <button
              type="submit"
              className="ml-auto rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-[13px] font-semibold text-[#0e1016] transition-opacity hover:opacity-90"
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
