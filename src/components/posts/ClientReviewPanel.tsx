"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approvePostByTokenAction,
  rejectPostByTokenAction,
} from "@/app/review/actions";
import { InstagramPostPreview } from "@/components/posts/InstagramPostPreview";
import { TelegramPostPreview } from "@/components/posts/TelegramPostPreview";
import { ClientPortalDiscussion } from "@/components/posts/ClientPortalDiscussion";
import type { PostReviewComment } from "@/components/posts/postReviewTypes";
import type { ClientRecord } from "@/domain/smm";
import type { PostType } from "@/types/postType";

type ClientReviewPanelProps = {
  clientReviewToken: string;
  postType: PostType;
  client: ClientRecord | null;
  imageUrls: string[];
  caption: string;
  location: string;
  firstComment: string;
  altText: string;
  initialDiscussion: PostReviewComment[];
  refMs: number;
};

export function ClientReviewPanel({
  clientReviewToken,
  postType,
  client,
  imageUrls,
  caption,
  location,
  firstComment,
  altText,
  initialDiscussion,
  refMs,
}: ClientReviewPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"idle" | "approved" | "rejected">(
    "idle"
  );
  const [actionError, setActionError] = useState("");

  const runApprove = () => {
    setActionError("");
    startTransition(async () => {
      const res = await approvePostByTokenAction(clientReviewToken);
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      setDecision("approved");
      router.refresh();
    });
  };

  const runReject = () => {
    setActionError("");
    startTransition(async () => {
      const res = await rejectPostByTokenAction(clientReviewToken);
      if (!res.ok) {
        setActionError(res.error);
        return;
      }
      setDecision("rejected");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <div
        className="flex w-full min-w-0 max-w-full justify-center rounded-2xl border border-[#efefef] p-4"
        style={{ background: "#fafafa" }}
      >
        {client?.platform === "telegram" ? (
          <TelegramPostPreview
            client={client}
            imageUrls={imageUrls}
            caption={caption}
          />
        ) : (
          <InstagramPostPreview
            postType={postType}
            client={client}
            imageUrls={imageUrls}
            caption={caption}
            location={location}
            firstComment={firstComment}
            altText={altText}
          />
        )}
      </div>

      <ClientPortalDiscussion
        clientReviewToken={clientReviewToken}
        initialComments={initialDiscussion}
        refMs={refMs}
      />

      {actionError ? (
        <p
          className="rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-[13px] text-rose-100"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="button"
          disabled={decision !== "idle" || isPending}
          onClick={runApprove}
          className="flex-1 rounded-xl border border-emerald-700/45 bg-emerald-950/55 px-4 py-3 text-[14px] font-semibold text-emerald-50 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Сохранение…" : "Одобрить"}
        </button>
        <button
          type="button"
          disabled={decision !== "idle" || isPending}
          onClick={runReject}
          className="flex-1 rounded-xl border border-rose-700/45 bg-rose-950/55 px-4 py-3 text-[14px] font-semibold text-rose-50 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Отклонить
        </button>
      </div>

      {decision !== "idle" ? (
        <p
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-center text-[14px] text-[var(--foreground)]"
          role="status"
        >
          {decision === "approved"
            ? "Спасибо: пост одобрён и переведён в статус «Ждёт публикации»."
            : "Пост отклонён. SMM увидит статус «Отклонён» и сможет подготовить новый вариант."}
        </p>
      ) : null}
    </div>
  );
}
